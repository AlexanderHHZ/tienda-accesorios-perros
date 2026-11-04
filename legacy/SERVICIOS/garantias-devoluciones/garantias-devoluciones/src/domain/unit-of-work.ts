import type { ProductRepository } from './products/product.js';
import type { ReturnRepository } from './returns/return-repository.js';
import type { SaleRepository } from './sales/sale.js';
import type { WarrantyRepository } from './warranties/warranty-repository.js';

export interface Repositories {
  readonly products: ProductRepository;
  readonly sales: SaleRepository;
  readonly returns: ReturnRepository;
  readonly warranties: WarrantyRepository;
}

/**
 * Ejecuta una operación aislada y atómica: sus lecturas y escrituras comparten
 * transacción. El adaptador debe revertir escrituras si la operación falla y
 * serializar conflictos sobre la misma venta y producto, también entre procesos.
 */
export interface UnitOfWork {
  run<T>(operation: (repositories: Repositories) => Promise<T>): Promise<T>;
}
