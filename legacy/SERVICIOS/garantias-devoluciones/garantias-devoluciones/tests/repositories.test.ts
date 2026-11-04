import { describe, expect, it } from 'vitest';
import { demoData } from '../src/mock/data.js';
import { createFixture, fixedDate } from './fixture.js';

describe('Aislamiento del adaptador en memoria', () => {
  it('deshace una escritura si la operación falla y permite la siguiente', async () => {
    const { unitOfWork, returns } = createFixture();
    await expect(unitOfWork.run(async (repositories) => {
      await repositories.returns.create({
        id_venta: 1001, id_producto: 102, cantidad: 1,
        motivo: 'Prueba de atomicidad.', fecha: fixedDate, estado: 'PENDING',
      });
      throw new Error('Fallo después de escribir.');
    })).rejects.toThrow('Fallo después de escribir.');
    expect(await returns.list()).toEqual(demoData.returns);
    await expect(returns.create({ saleId: 1001, productId: 102, quantity: 2, reason: 'Nueva solicitud.' }))
      .resolves.toMatchObject({ cantidad: 2 });
  });

  it('las respuestas y el seed no son referencias al almacenamiento', async () => {
    const seed = structuredClone(demoData);
    const { unitOfWork, returns } = createFixture(seed);
    seed.products.length = 0;
    const returned = await returns.getById(5001);
    Object.assign(returned, { cantidad: 999 });
    await unitOfWork.run(async (repositories) => {
      const product = await repositories.products.findById(101);
      const sale = await repositories.sales.findById(1001);
      const details = await repositories.sales.findDetails(1001, 102);
      const warranty = await repositories.warranties.findById(6001);
      if (product) Object.assign(product, { nombre: 'Alterado' });
      if (sale) Object.assign(sale, { total: -1 });
      if (details[0]) Object.assign(details[0], { cantidad: 999 });
      if (warranty) Object.assign(warranty, { estado: 'APPROVED' });
    });
    expect((await returns.getById(5001)).cantidad).toBe(1);
    await unitOfWork.run(async (repositories) => {
      expect((await repositories.products.findById(101))?.nombre).toBe('Pintura acrílica blanca 1 L');
      expect((await repositories.sales.findById(1001))?.total).toBe(450);
      expect((await repositories.sales.findDetails(1001, 102))[0]?.cantidad).toBe(2);
      expect((await repositories.warranties.findById(6001))?.estado).toBe('REJECTED');
    });
  });

  it('dos composiciones de aplicación no comparten datos', async () => {
    const first = createFixture();
    const second = createFixture();
    await first.returns.create({ saleId: 1001, productId: 102, quantity: 2, reason: 'Envase defectuoso.' });
    expect(await second.returns.list()).toHaveLength(1);
  });
});
