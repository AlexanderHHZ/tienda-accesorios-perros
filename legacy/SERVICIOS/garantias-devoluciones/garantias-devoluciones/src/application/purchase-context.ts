import { DomainError } from '../domain/errors.js';
import type { Repositories } from '../domain/unit-of-work.js';
import { assertIdentifier } from '../domain/validation.js';

/** Suma todas las líneas del producto: el esquema no impone una sola línea por venta. */
export async function getPurchasedQuantity(
  repositories: Repositories,
  saleId: number,
  productId: number,
): Promise<number> {
  assertIdentifier(saleId);
  assertIdentifier(productId);
  if (!(await repositories.sales.findById(saleId))) {
    throw new DomainError('SALE_NOT_FOUND', 'La venta indicada no existe.');
  }
  if (!(await repositories.products.findById(productId))) {
    throw new DomainError('PRODUCT_NOT_FOUND', 'El producto indicado no existe.');
  }
  const details = await repositories.sales.findDetails(saleId, productId);
  if (details.length === 0) {
    throw new DomainError('PRODUCT_NOT_IN_SALE', 'El producto no pertenece a la venta indicada.');
  }
  const purchased = details.reduce((total, detail) => total + detail.cantidad, 0);
  if (!Number.isSafeInteger(purchased) || purchased <= 0) {
    throw new Error('Los detalles de venta contienen una cantidad acumulada inválida.');
  }
  return purchased;
}
