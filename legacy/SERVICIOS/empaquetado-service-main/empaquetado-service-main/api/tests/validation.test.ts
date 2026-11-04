import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fixture, validInput } from './helpers.js';

describe('Validación del contrato', () => {
  let context: Awaited<ReturnType<typeof fixture>>;
  beforeEach(async () => {
    context = await fixture();
  });
  afterEach(async () => {
    await context.close();
  });

  it.each([
    { ...validInput, peso: 0 },
    { ...validInput, peso: -2 },
    { ...validInput, peso: '4.5' },
    { ...validInput, peso: null },
    { ...validInput, peso: 1e10 },
    { ...validInput, tamano: 'extra' },
    { ...validInput, tipoEmpacado: 'sobre' },
    { ...validInput, medidas: { largo: 0, ancho: 20, alto: 10 } },
    { ...validInput, medidas: { largo: 20, ancho: -1, alto: 10 } },
    { ...validInput, medidas: { largo: 20, ancho: 10, alto: null } },
    { ...validInput, medidas: '30x20x10' },
    { ...validInput, medidas: { largo: 20, ancho: 10 } },
    { ...validInput, unknown: true },
    {},
  ])('rechaza entradas inválidas: %j', async (payload) => {
    const response = await context.app.inject({
      method: 'POST',
      url: '/api/v1/empaquetados',
      payload,
    });
    expect(response.statusCode).toBe(400);
    expect(response.json<unknown>()).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: expect.any(Array) },
    });
  });

  it.each(['0', '-1', '1.5', 'abc', '1e2', '9007199254740992'])('rechaza ID %s', async (id) => {
    expect((await context.app.inject(`/api/v1/empaquetados/${id}`)).statusCode).toBe(400);
  });

  it.each([
    'page=0',
    'page=1.5',
    'limit=101',
    'sortBy=raw_sql',
    'order=up',
    'tamano=mini',
    'noExiste=1',
  ])('rechaza parámetros %s', async (query) => {
    expect((await context.app.inject(`/api/v1/empaquetados?${query}`)).statusCode).toBe(400);
  });

  it.each([{}, { medidas: {} }, { id: 8 }, { medidas: { alto: 0 } }])(
    'rechaza PATCH inválido: %j',
    async (payload) => {
      const item = await context.create();
      const response = await context.app.inject({
        method: 'PATCH',
        url: `/api/v1/empaquetados/${item.id}`,
        payload,
      });
      expect(response.statusCode).toBe(400);
    },
  );

  it('rechaza JSON mal formado y tipo de contenido incorrecto', async () => {
    const malformed = await context.app.inject({
      method: 'POST',
      url: '/api/v1/empaquetados',
      headers: { 'content-type': 'application/json' },
      payload: '{"peso":',
    });
    expect(malformed.statusCode).toBe(400);
    expect(malformed.json<unknown>()).toMatchObject({ error: { code: 'INVALID_JSON' } });
    const plain = await context.app.inject({
      method: 'POST',
      url: '/api/v1/empaquetados',
      headers: { 'content-type': 'text/plain' },
      payload: 'anything',
    });
    expect(plain.statusCode).toBe(415);
  });
});
