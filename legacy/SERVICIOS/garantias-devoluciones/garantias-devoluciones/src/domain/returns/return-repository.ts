import type { NewReturn, SaleReturn } from './return.js';

/** Las escrituras deben ejecutarse dentro de UnitOfWork para conservar la capacidad. */
export interface ReturnRepository {
  findAll(): Promise<readonly SaleReturn[]>;
  findById(id: number): Promise<SaleReturn | null>;
  findBySaleAndProduct(saleId: number, productId: number): Promise<readonly SaleReturn[]>;
  create(record: NewReturn): Promise<SaleReturn>;
  save(record: SaleReturn): Promise<SaleReturn>;
}
