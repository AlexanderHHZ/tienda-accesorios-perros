import { describe, expect, it } from 'vitest';
import { demoData } from '../src/mock/data.js';
import { createFixture, fixedDate } from './fixture.js';

const input = { saleId: 1001, productId: 102, quantity: 1, reason: 'Envase defectuoso.' };

describe('Devoluciones', () => {
  it('crea una devolución PENDING con fecha asignada y columnas exactas', async () => {
    const { returns } = createFixture();
    const record = await returns.create({ ...input, reason: '  Envase defectuoso.  ' });
    expect(record).toEqual({
      id: 5002, id_venta: 1001, id_producto: 102, cantidad: 1,
      motivo: input.reason, fecha: fixedDate, estado: 'PENDING',
    });
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    'rechaza una cantidad inválida: %s', async (quantity) => {
      const { returns } = createFixture();
      await expect(returns.create({ ...input, quantity })).rejects.toMatchObject({ code: 'INVALID_QUANTITY' });
    },
  );

  it.each([
    [{ saleId: 9999 }, 'SALE_NOT_FOUND'],
    [{ productId: 9999 }, 'PRODUCT_NOT_FOUND'],
    [{ productId: 103 }, 'PRODUCT_NOT_IN_SALE'],
    [{ saleId: 0 }, 'INVALID_ID'],
    [{ reason: '   ' }, 'INVALID_REASON'],
  ])('rechaza datos de compra inválidos: %j', async (override, code) => {
    const { returns } = createFixture();
    await expect(returns.create({ ...input, ...override })).rejects.toMatchObject({ code });
  });

  it('rechaza devolver más unidades de las compradas', async () => {
    const { returns } = createFixture();
    await expect(returns.create({ ...input, quantity: 3 })).rejects.toMatchObject({ code: 'RETURN_QUANTITY_EXCEEDED' });
  });

  it('acumula devoluciones anteriores y bloquea cuando se agota la cantidad', async () => {
    const { returns } = createFixture();
    await returns.create(input);
    await expect(returns.create({ ...input, quantity: 2 })).rejects.toMatchObject({ code: 'RETURN_QUANTITY_EXCEEDED' });
    await returns.create(input);
    await expect(returns.create(input)).rejects.toMatchObject({ code: 'RETURN_QUANTITY_EXCEEDED' });
  });

  it('descuenta las devoluciones completadas del fixture', async () => {
    const { returns } = createFixture();
    const existing = { ...input, saleId: 1002, productId: 103 };
    await expect(returns.create({ ...existing, quantity: 3 })).rejects.toMatchObject({ code: 'RETURN_QUANTITY_EXCEEDED' });
    await expect(returns.create({ ...existing, quantity: 2 })).resolves.toMatchObject({ cantidad: 2 });
  });

  it('una devolución rechazada libera las unidades reservadas', async () => {
    const { returns } = createFixture();
    const created = await returns.create({ ...input, quantity: 2 });
    await returns.changeStatus(created.id, 'REJECTED');
    await expect(returns.create({ ...input, quantity: 2 })).resolves.toMatchObject({ estado: 'PENDING' });
  });

  it('una devolución aprobada sigue reservando unidades', async () => {
    const { returns } = createFixture();
    const created = await returns.create({ ...input, quantity: 2 });
    await returns.changeStatus(created.id, 'APPROVED');
    await expect(returns.create(input)).rejects.toMatchObject({ code: 'RETURN_QUANTITY_EXCEEDED' });
  });

  it('suma líneas repetidas del mismo producto en DETALLE_VENTAS', async () => {
    const seed = structuredClone(demoData);
    seed.saleDetails.push({ id: 2004, id_venta: 1001, id_producto: 102, cantidad: 1, precio_unitario: 100 });
    const { returns } = createFixture(seed);
    await expect(returns.create({ ...input, quantity: 3 })).resolves.toMatchObject({ cantidad: 3 });
  });

  it('consulta por ID y lista lo creado', async () => {
    const { returns } = createFixture();
    const record = await returns.create(input);
    expect(await returns.getById(record.id)).toEqual(record);
    expect(await returns.list()).toContainEqual(record);
  });

  it('rechaza consulta y actualización de IDs inexistentes', async () => {
    const { returns } = createFixture();
    await expect(returns.getById(9999)).rejects.toMatchObject({ code: 'RETURN_NOT_FOUND' });
    await expect(returns.changeStatus(9999, 'APPROVED')).rejects.toMatchObject({ code: 'RETURN_NOT_FOUND' });
  });

  it('aprueba y completa; una transición inválida no modifica el registro', async () => {
    const { returns } = createFixture();
    const record = await returns.create(input);
    await expect(returns.changeStatus(record.id, 'APPROVED')).resolves.toMatchObject({ estado: 'APPROVED' });
    await expect(returns.changeStatus(record.id, 'COMPLETED')).resolves.toMatchObject({ estado: 'COMPLETED' });
    await expect(returns.changeStatus(record.id, 'PENDING')).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
    expect((await returns.getById(record.id)).estado).toBe('COMPLETED');
  });

  it('dos solicitudes simultáneas no pueden exceder la compra', async () => {
    const { returns } = createFixture();
    const results = await Promise.allSettled([
      returns.create({ ...input, quantity: 2 }), returns.create({ ...input, quantity: 2 }),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results).toContainEqual(expect.objectContaining({
      status: 'rejected', reason: expect.objectContaining({ code: 'RETURN_QUANTITY_EXCEEDED' }),
    }));
  });
});
