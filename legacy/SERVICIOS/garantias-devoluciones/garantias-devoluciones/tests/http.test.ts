import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
import { readConfig } from '../src/config.js';
import { errorSchema } from '../src/http/schemas/common.js';
import { returnResponseSchema } from '../src/http/schemas/returns.js';
import { warrantyResponseSchema } from '../src/http/schemas/warranties.js';
import { fixedDate } from './fixture.js';

describe('Contrato HTTP', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  const returnInput = {
    saleId: 1001,
    productId: 102,
    quantity: 1,
    reason: 'Envase defectuoso.',
  };

  const warrantyInput = {
    saleId: 1001,
    productId: 101,
    reason: 'Consistencia incorrecta.',
  };

  beforeEach(async () => {
    app = await buildApp({
      now: () => new Date(fixedDate),
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST, GET y PATCH de devoluciones respetan el contrato y Location', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/returns',
      payload: returnInput,
    });

    expect(created.statusCode).toBe(201);

    const record = returnResponseSchema.parse(created.json<unknown>());

    expect(record.status).toBe('PENDING');
    expect(record.date).toBe(fixedDate);
    expect(created.headers.location).toBe(
      `/api/v1/returns/${record.id}`,
    );

    const found = await app.inject(
      `/api/v1/returns/${record.id}`,
    );

    expect(found.statusCode).toBe(200);
    expect(found.json<unknown>()).toEqual(record);

    const list = await app.inject('/api/v1/returns');

    expect(list.statusCode).toBe(200);
    expect(list.json<unknown>()).toContainEqual(record);

    for (const status of ['APPROVED', 'COMPLETED']) {
      const updated = await app.inject({
        method: 'PATCH',
        url: `/api/v1/returns/${record.id}/status`,
        payload: { status },
      });

      expect(updated.statusCode).toBe(200);
      expect(updated.json<unknown>()).toMatchObject({ status });
    }

    const invalid = await app.inject({
      method: 'PATCH',
      url: `/api/v1/returns/${record.id}/status`,
      payload: { status: 'PENDING' },
    });

    expect(invalid.statusCode).toBe(409);
    expect(
      errorSchema.parse(invalid.json<unknown>()).error.code,
    ).toBe('INVALID_STATUS_TRANSITION');
  });

  it('responde 409 al exceder la cantidad comprada o reservada', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/v1/returns',
      payload: returnInput,
    });

    const result = await app.inject({
      method: 'POST',
      url: '/api/v1/returns',
      payload: {
        ...returnInput,
        quantity: 2,
      },
    });

    expect(result.statusCode).toBe(409);
    expect(
      errorSchema.parse(result.json<unknown>()).error.code,
    ).toBe('RETURN_QUANTITY_EXCEEDED');
  });

  it('POST, GET y PATCH de garantías permiten la demostración completa', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/warranties',
      payload: warrantyInput,
    });

    expect(created.statusCode).toBe(201);

    const record = warrantyResponseSchema.parse(
      created.json<unknown>(),
    );

    expect(record.status).toBe('PENDING');
    expect(record).not.toHaveProperty('quantity');
    expect(record.resolution).toBe('');
    expect(created.headers.location).toBe(
      `/api/v1/warranties/${record.id}`,
    );

    const found = await app.inject(
      `/api/v1/warranties/${record.id}`,
    );

    expect(found.statusCode).toBe(200);
    expect(found.json<unknown>()).toEqual(record);

    const list = await app.inject('/api/v1/warranties');

    expect(list.statusCode).toBe(200);
    expect(list.json<unknown>()).toContainEqual(record);

    const url = `/api/v1/warranties/${record.id}/status`;

    const approved = await app.inject({
      method: 'PATCH',
      url,
      payload: {
        status: 'APPROVED',
        resolution: 'Se autoriza reemplazo del producto.',
      },
    });

    expect(approved.statusCode).toBe(200);

    const completed = await app.inject({
      method: 'PATCH',
      url,
      payload: {
        status: 'COMPLETED',
      },
    });

    expect(completed.statusCode).toBe(200);
    expect(completed.json<unknown>()).toMatchObject({
      status: 'COMPLETED',
      resolution: 'Se autoriza reemplazo del producto.',
    });

    const invalid = await app.inject({
      method: 'PATCH',
      url,
      payload: {
        status: 'PENDING',
      },
    });

    expect(invalid.statusCode).toBe(409);
  });

  it('dos POST simultáneos de garantías producen 201 y 409', async () => {
    const responses = await Promise.all([
      app.inject({
        method: 'POST',
        url: '/api/v1/warranties',
        payload: warrantyInput,
      }),
      app.inject({
        method: 'POST',
        url: '/api/v1/warranties',
        payload: warrantyInput,
      }),
    ]);

    expect(
      responses
        .map((response) => response.statusCode)
        .sort(),
    ).toEqual([201, 409]);
  });

  it.each(['returns', 'warranties'])(
    'valida venta, producto y pertenencia en %s',
    async (resource) => {
      const input =
        resource === 'returns'
          ? returnInput
          : warrantyInput;

      for (const [override, status, code] of [
        [{ saleId: 9999 }, 404, 'SALE_NOT_FOUND'],
        [{ productId: 9999 }, 404, 'PRODUCT_NOT_FOUND'],
        [{ productId: 103 }, 400, 'PRODUCT_NOT_IN_SALE'],
      ] as const) {
        const response = await app.inject({
          method: 'POST',
          url: `/api/v1/${resource}`,
          payload: {
            ...input,
            ...override,
          },
        });

        expect(response.statusCode).toBe(status);
        expect(
          errorSchema.parse(response.json<unknown>()).error.code,
        ).toBe(code);
      }
    },
  );

  it.each([0, -1, 1.5, '1', null])(
    'rechaza quantity inválida en HTTP: %s',
    async (quantity) => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/returns',
        payload: {
          ...returnInput,
          quantity,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(
        errorSchema.parse(response.json<unknown>()).error.code,
      ).toBe('INVALID_QUANTITY');
    },
  );

  it.each([
    {},
    { ...returnInput, saleId: '1001' },
    { ...returnInput, saleId: 0 },
    { ...returnInput, productId: 1.5 },
    { ...returnInput, reason: '' },
    { ...returnInput, reason: '   ' },
    { ...returnInput, reason: 'a'.repeat(2001) },
    { ...returnInput, status: 'COMPLETED' },
    { ...returnInput, id: 777 },
  ])('rechaza body inválido: %j', async (payload) => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/returns',
      payload,
    });

    expect(response.statusCode).toBe(400);
    expect(
      errorSchema.safeParse(response.json<unknown>()).success,
    ).toBe(true);
  });

  it('no acepta cantidad ni resolución durante la creación de garantías', async () => {
    for (const field of [
      { quantity: 1 },
      { resolution: 'Creada por cliente.' },
    ]) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/warranties',
        payload: {
          ...warrantyInput,
          ...field,
        },
      });

      expect(response.statusCode).toBe(400);
    }
  });

  it.each(['returns', 'warranties'])(
    'rechaza IDs y estados inválidos en %s',
    async (resource) => {
      for (const id of [
        'abc',
        '0',
        '-1',
        '1.5',
        '9007199254740992',
      ]) {
        expect(
          (
            await app.inject(
              `/api/v1/${resource}/${id}`,
            )
          ).statusCode,
        ).toBe(400);
      }

      const seedId =
        resource === 'returns'
          ? 5001
          : 6001;

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/${resource}/${seedId}/status`,
        payload: {
          status: 'UNKNOWN',
        },
      });

      expect(response.statusCode).toBe(400);

      expect(
        (
          await app.inject(
            `/api/v1/${resource}/9999`,
          )
        ).statusCode,
      ).toBe(404);

      expect(
        (
          await app.inject({
            method: 'PATCH',
            url: `/api/v1/${resource}/9999/status`,
            payload: {
              status: 'APPROVED',
            },
          })
        ).statusCode,
      ).toBe(404);
    },
  );

  it('valida resolución vacía y exige resultado para completar', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/warranties',
      payload: warrantyInput,
    });

    const id = warrantyResponseSchema.parse(
      created.json<unknown>(),
    ).id;

    const url = `/api/v1/warranties/${id}/status`;

    expect(
      (
        await app.inject({
          method: 'PATCH',
          url,
          payload: {
            status: 'APPROVED',
            resolution: ' ',
          },
        })
      ).statusCode,
    ).toBe(400);

    await app.inject({
      method: 'PATCH',
      url,
      payload: {
        status: 'APPROVED',
      },
    });

    const response = await app.inject({
      method: 'PATCH',
      url,
      payload: {
        status: 'COMPLETED',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(
      errorSchema.parse(response.json<unknown>()).error.code,
    ).toBe('RESOLUTION_REQUIRED');
  });

  it('responde consistentemente ante JSON roto, formato no admitido y rutas desconocidas', async () => {
    const malformed = await app.inject({
      method: 'POST',
      url: '/api/v1/returns',
      headers: {
        'content-type': 'application/json',
      },
      payload: '{broken',
    });

    expect(malformed.statusCode).toBe(400);
    expect(
      errorSchema.parse(malformed.json<unknown>()).error.code,
    ).toBe('INVALID_JSON');

    const unsupported = await app.inject({
      method: 'POST',
      url: '/api/v1/returns',
      headers: {
        'content-type': 'application/xml',
      },
      payload: '<return />',
    });

    expect(unsupported.statusCode).toBe(415);
    expect(
      errorSchema.parse(unsupported.json<unknown>()).error.code,
    ).toBe('UNSUPPORTED_MEDIA_TYPE');

    const unknown = await app.inject('/missing');

    expect(unknown.statusCode).toBe(404);
    expect(
      errorSchema.parse(unknown.json<unknown>()).error.code,
    ).toBe('ROUTE_NOT_FOUND');
  });

  /**
   * Evita que un Content-Length inconsistente termine convertido
   * accidentalmente en un error interno 500.
   */
  it('responde 400 cuando Content-Length no coincide con el cuerpo recibido', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/returns',
      headers: {
        'content-type': 'application/json',
        'content-length': '999',
      },
      payload: JSON.stringify(returnInput),
    });

    expect(response.statusCode).toBe(400);
    expect(
      errorSchema.parse(response.json<unknown>()).error.code,
    ).toBe('INVALID_CONTENT_LENGTH');
  });

  it('limita el body y conserva el formato de error', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/returns',
      payload: {
        ...returnInput,
        reason: 'a'.repeat(17000),
      },
    });

    expect(response.statusCode).toBe(413);
    expect(
      errorSchema.parse(response.json<unknown>()).error.code,
    ).toBe('PAYLOAD_TOO_LARGE');
  });

  it('mantiene la envoltura de error incluso ante una URL mal codificada', async () => {
    const response = await app.inject(
      '/api/v1/returns/%ZZ',
    );

    expect(response.statusCode).toBe(400);
    expect(
      errorSchema.parse(response.json<unknown>()).error.code,
    ).toBe('INVALID_URL');
  });

  it('sirve Swagger y un OpenAPI con exactamente las ocho operaciones públicas', async () => {
    const ui = await app.inject('/docs/');

    expect(ui.statusCode).toBe(200);
    expect(ui.body).toContain('swagger-ui');

    const spec = await app.inject('/docs/json');

    expect(spec.statusCode).toBe(200);

    const document = spec.json<{
      openapi: string;
      paths: Record<string, Record<string, unknown>>;
    }>();

    expect(document.openapi).toBe('3.0.3');

    expect(
      Object.keys(document.paths).sort(),
    ).toEqual(
      [
        '/api/v1/returns',
        '/api/v1/returns/{id}',
        '/api/v1/returns/{id}/status',
        '/api/v1/warranties',
        '/api/v1/warranties/{id}',
        '/api/v1/warranties/{id}/status',
      ].sort(),
    );

    expect(
      Object.values(document.paths).flatMap(
        (path) => Object.keys(path),
      ),
    ).toHaveLength(8);

    expect(
      JSON.stringify(
        document.paths['/api/v1/warranties'],
      ),
    ).not.toContain('"quantity"');

    expect(
      document.paths['/api/v1/returns'],
    ).toMatchObject({
      post: {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                required: [
                  'saleId',
                  'productId',
                  'quantity',
                  'reason',
                ],
                additionalProperties: false,
              },
              example: {
                saleId: 1001,
                productId: 102,
                quantity: 1,
              },
            },
          },
        },
      },
    });
  });
});

describe('Fallos internos y configuración', () => {
  it('oculta detalles de infraestructura y devuelve 500', async () => {
    const app = await buildApp({
      unitOfWork: {
        run: async () => {
          throw new Error(
            'contraseña-secreta-en-error',
          );
        },
      },
    });

    try {
      const response = await app.inject(
        '/api/v1/returns',
      );

      expect(response.statusCode).toBe(500);

      expect(response.json<unknown>()).toEqual({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message:
            'No se pudo procesar la solicitud.',
        },
      });

      expect(response.body).not.toContain(
        'contraseña',
      );

      expect(response.body).not.toContain('stack');
    } finally {
      await app.close();
    }
  });

  it('rechaza un puerto inválido y respeta valores configurados', () => {
    expect(() =>
      readConfig({
        PORT: 'not-a-port',
      }),
    ).toThrow('Configuración inválida');

    expect(
      readConfig({
        PORT: '3100',
        LOG_LEVEL: 'silent',
      }),
    ).toMatchObject({
      PORT: 3100,
      LOG_LEVEL: 'silent',
    });
  });
});
