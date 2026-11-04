import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fixture, validInput } from './helpers.js';
import { itemResponseSchema, listResponseSchema } from '../src/modules/empaquetados/schemas.js';

describe('CRUD HTTP contra SQLite real', () => {
  let context: Awaited<ReturnType<typeof fixture>>;
  beforeEach(async () => {
    context = await fixture();
  });
  afterEach(async () => {
    await context.close();
  });

  it('crea, devuelve 201, Location, unidades y fechas', async () => {
    const response = await context.app.inject({
      method: 'POST',
      url: '/api/v1/empaquetados',
      payload: validInput,
    });
    expect(response.statusCode).toBe(201);
    const { data } = itemResponseSchema.parse(response.json<unknown>());
    expect(data).toMatchObject(validInput);
    expect(response.headers.location).toBe(`/api/v1/empaquetados/${data.id}`);
    expect(data.createdAt).toBe(data.updatedAt);
    expect(response.headers['content-type']).toContain('application/json');
  });

  it('lista una base vacía con metadatos coherentes', async () => {
    const response = await context.app.inject('/api/v1/empaquetados');
    expect(response.statusCode).toBe(200);
    expect(listResponseSchema.parse(response.json<unknown>())).toEqual({
      success: true,
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        summary: { cajas: 0, bolsas: 0, pesoTotal: 0 },
      },
    });
  });

  it('lista, filtra, ordena, pagina y calcula totales de todos los resultados', async () => {
    await context.create();
    await context.create({ ...validInput, peso: 7 });
    await context.create({ ...validInput, peso: 2, tipoEmpacado: 'bolsa' });
    const response = await context.app.inject(
      '/api/v1/empaquetados?tipoEmpacado=caja&limit=1&page=2&sortBy=peso&order=asc',
    );
    const body = listResponseSchema.parse(response.json<unknown>());
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.peso).toBe(7);
    expect(body.meta).toMatchObject({
      total: 2,
      page: 2,
      totalPages: 2,
      summary: { cajas: 2, bolsas: 0, pesoTotal: 11.5 },
    });
  });

  it('obtiene un registro por ID y busca por ID visible o texto', async () => {
    const item = await context.create();
    const found = await context.app.inject(`/api/v1/empaquetados/${item.id}`);
    expect(itemResponseSchema.parse(found.json<unknown>()).data).toEqual(item);
    for (const term of [`EMP-${String(item.id).padStart(4, '0')}`, 'mediano', 'caj']) {
      const response = await context.app.inject(`/api/v1/empaquetados?q=${term}`);
      expect(listResponseSchema.parse(response.json<unknown>()).meta.total).toBe(1);
    }
  });

  it('trata comodines y SQL como texto, sin alterar consultas', async () => {
    await context.create();
    for (const term of ['%', '_', "' OR 1=1 --"]) {
      const response = await context.app.inject(
        `/api/v1/empaquetados?q=${encodeURIComponent(term)}`,
      );
      expect(listResponseSchema.parse(response.json<unknown>()).meta.total).toBe(0);
    }
  });

  it('actualiza una dimensión y conserva las demás y createdAt', async () => {
    const item = await context.create();
    const response = await context.app.inject({
      method: 'PATCH',
      url: `/api/v1/empaquetados/${item.id}`,
      payload: { peso: 5, medidas: { alto: 22 } },
    });
    expect(response.statusCode).toBe(200);
    const updated = itemResponseSchema.parse(response.json<unknown>()).data;
    expect(updated).toMatchObject({
      peso: 5,
      medidas: { largo: 40, ancho: 30, alto: 22 },
      createdAt: item.createdAt,
    });
    expect(updated.updatedAt > item.updatedAt).toBe(true);
  });

  it('responde 409 ante edición o eliminación con una versión obsoleta', async () => {
    const item = await context.create();
    await context.app.inject({
      method: 'PATCH',
      url: `/api/v1/empaquetados/${item.id}`,
      payload: { peso: 9 },
    });
    for (const method of ['PATCH', 'DELETE'] as const) {
      const response = await context.app.inject({
        method,
        url: `/api/v1/empaquetados/${item.id}`,
        headers: { 'x-expected-updated-at': item.updatedAt },
        ...(method === 'PATCH' ? { payload: { peso: 1 } } : {}),
      });
      expect(response.statusCode).toBe(409);
      expect(response.json<unknown>()).toMatchObject({
        success: false,
        error: { code: 'EDIT_CONFLICT' },
      });
    }
    const result = await context.app.inject(`/api/v1/empaquetados/${item.id}`);
    expect(itemResponseSchema.parse(result.json<unknown>()).data.peso).toBe(9);
  });

  it('elimina con 204 sin cuerpo y devuelve 404 posteriormente', async () => {
    const item = await context.create();
    const response = await context.app.inject({
      method: 'DELETE',
      url: `/api/v1/empaquetados/${item.id}`,
      headers: { 'x-expected-updated-at': item.updatedAt },
    });
    expect(response.statusCode).toBe(204);
    expect(response.body).toBe('');
    expect((await context.app.inject(`/api/v1/empaquetados/${item.id}`)).statusCode).toBe(404);
  });

  it.each(['GET', 'PATCH', 'DELETE'] as const)('%s distingue ID inexistente', async (method) => {
    const response = await context.app.inject({
      method,
      url: '/api/v1/empaquetados/999',
      ...(method === 'PATCH' ? { payload: { peso: 2 } } : {}),
    });
    expect(response.statusCode).toBe(404);
    expect(response.json<unknown>()).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND' },
    });
  });
});
