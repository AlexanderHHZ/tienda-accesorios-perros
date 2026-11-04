import type { Product } from '../../domain/products/product.js';
import type { SaleReturn } from '../../domain/returns/return.js';
import type { Sale, SaleDetail } from '../../domain/sales/sale.js';
import type { Repositories, UnitOfWork } from '../../domain/unit-of-work.js';
import type { Warranty } from '../../domain/warranties/warranty.js';
import { InMemoryProductRepository } from './in-memory-product-repository.js';
import { InMemoryReturnRepository } from './in-memory-return-repository.js';
import { InMemorySaleRepository } from './in-memory-sale-repository.js';
import { InMemoryWarrantyRepository } from './in-memory-warranty-repository.js';

/** Contenedor de fixtures: cada arreglo representa una tabla, no una entidad nueva. */
export interface MemoryData {
  products: Product[];
  sales: Sale[];
  saleDetails: SaleDetail[];
  returns: SaleReturn[];
  warranties: Warranty[];
}

/**
 * Serializa operaciones en una instancia del proceso. Solo publica el snapshot
 * cuando la operación termina; un error descarta todos sus cambios.
 * Un adaptador real debe ofrecer estas garantías mediante transacciones de la BD.
 */
export class InMemoryUnitOfWork implements UnitOfWork {
  private data: MemoryData;
  private tail: Promise<void> = Promise.resolve();

  constructor(seed: MemoryData) {
    this.data = structuredClone(seed);
  }

  run<T>(operation: (repositories: Repositories) => Promise<T>): Promise<T> {
    const result = this.tail.then(async () => {
      const snapshot = structuredClone(this.data);
      const repositories: Repositories = {
        products: new InMemoryProductRepository(snapshot.products),
        sales: new InMemorySaleRepository(snapshot.sales, snapshot.saleDetails),
        returns: new InMemoryReturnRepository(snapshot.returns),
        warranties: new InMemoryWarrantyRepository(snapshot.warranties),
      };
      const value = await operation(repositories);
      // La copia también evita que un repositorio retenido altere el estado confirmado.
      this.data = structuredClone(snapshot);
      return value;
    });
    // Un rechazo no debe bloquear las siguientes peticiones.
    this.tail = result.then(() => undefined, () => undefined);
    return result;
  }
}
