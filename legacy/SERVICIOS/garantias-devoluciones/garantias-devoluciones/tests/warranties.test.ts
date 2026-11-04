import { describe, expect, it } from 'vitest';
import { createFixture, fixedDate } from './fixture.js';

const input = { saleId: 1001, productId: 101, reason: 'Consistencia incorrecta.' };

describe('Garantías', () => {
  it('crea en PENDING, sin cantidad y sin añadir campos al modelo', async () => {
    const { warranties } = createFixture();
    expect(await warranties.create(input)).toEqual({
      id: 6002, id_venta: 1001, id_producto: 101, motivo: input.reason,
      fecha_solicitud: fixedDate, estado: 'PENDING', resolucion: '',
    });
  });

  it.each([
    [{ saleId: 9999 }, 'SALE_NOT_FOUND'],
    [{ productId: 9999 }, 'PRODUCT_NOT_FOUND'],
    [{ productId: 103 }, 'PRODUCT_NOT_IN_SALE'],
    [{ productId: -1 }, 'INVALID_ID'],
    [{ reason: '  ' }, 'INVALID_REASON'],
  ])('valida la compra: %j', async (override, code) => {
    const { warranties } = createFixture();
    await expect(warranties.create({ ...input, ...override })).rejects.toMatchObject({ code });
  });

  it.each(['PENDING', 'APPROVED'] as const)('evita duplicados cuando existe %s', async (status) => {
    const { warranties } = createFixture();
    const record = await warranties.create(input);
    if (status === 'APPROVED') await warranties.changeStatus(record.id, status);
    await expect(warranties.create(input)).rejects.toMatchObject({ code: 'ACTIVE_WARRANTY_ALREADY_EXISTS' });
  });

  it.each(['REJECTED', 'COMPLETED'] as const)('permite otra solicitud después de %s', async (status) => {
    const { warranties } = createFixture();
    const record = await warranties.create(input);
    if (status === 'COMPLETED') await warranties.changeStatus(record.id, 'APPROVED');
    await warranties.changeStatus(record.id, status, 'Revisión concluida.');
    await expect(warranties.create(input)).resolves.toMatchObject({ estado: 'PENDING' });
  });

  it('consulta por ID y lista las garantías', async () => {
    const { warranties } = createFixture();
    const record = await warranties.create(input);
    expect(await warranties.getById(record.id)).toEqual(record);
    expect(await warranties.list()).toContainEqual(record);
  });

  it('rechaza consulta y cambio de estado de IDs inexistentes', async () => {
    const { warranties } = createFixture();
    await expect(warranties.getById(9999)).rejects.toMatchObject({ code: 'WARRANTY_NOT_FOUND' });
    await expect(warranties.changeStatus(9999, 'APPROVED')).rejects.toMatchObject({ code: 'WARRANTY_NOT_FOUND' });
  });

  it('registra resolución al aprobar y la conserva al completar', async () => {
    const { warranties } = createFixture();
    const record = await warranties.create(input);
    await warranties.changeStatus(record.id, 'APPROVED', '  Se autoriza reemplazo del producto.  ');
    await expect(warranties.changeStatus(record.id, 'COMPLETED')).resolves.toMatchObject({
      estado: 'COMPLETED', resolucion: 'Se autoriza reemplazo del producto.',
    });
  });

  it('permite aprobar sin resolución, pero la exige al completar', async () => {
    const { warranties } = createFixture();
    const record = await warranties.create(input);
    await warranties.changeStatus(record.id, 'APPROVED');
    await expect(warranties.changeStatus(record.id, 'COMPLETED')).rejects.toMatchObject({ code: 'RESOLUTION_REQUIRED' });
    expect((await warranties.getById(record.id)).estado).toBe('APPROVED');
    await expect(warranties.changeStatus(record.id, 'COMPLETED', 'Producto reemplazado.'))
      .resolves.toMatchObject({ estado: 'COMPLETED', resolucion: 'Producto reemplazado.' });
  });

  it('una resolución vacía no cambia el estado', async () => {
    const { warranties } = createFixture();
    const record = await warranties.create(input);
    await expect(warranties.changeStatus(record.id, 'APPROVED', ' ')).rejects.toMatchObject({ code: 'INVALID_RESOLUTION' });
    expect((await warranties.getById(record.id)).estado).toBe('PENDING');
  });

  it('no reactiva una garantía rechazada', async () => {
    const { warranties } = createFixture();
    const record = await warranties.create(input);
    await warranties.changeStatus(record.id, 'REJECTED', 'Solicitud revisada y rechazada.');
    await expect(warranties.changeStatus(record.id, 'APPROVED')).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
  });

  it('evita garantías activas duplicadas bajo concurrencia', async () => {
    const { warranties } = createFixture();
    const results = await Promise.allSettled([warranties.create(input), warranties.create(input)]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results).toContainEqual(expect.objectContaining({
      status: 'rejected', reason: expect.objectContaining({ code: 'ACTIVE_WARRANTY_ALREADY_EXISTS' }),
    }));
  });
});
