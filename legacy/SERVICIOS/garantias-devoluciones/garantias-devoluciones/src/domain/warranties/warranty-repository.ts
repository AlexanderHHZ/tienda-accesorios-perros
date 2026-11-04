import type { NewWarranty, Warranty } from './warranty.js';

export interface WarrantyRepository {
  findAll(): Promise<readonly Warranty[]>;
  findById(id: number): Promise<Warranty | null>;
  findBySaleAndProduct(saleId: number, productId: number): Promise<readonly Warranty[]>;
  create(record: NewWarranty): Promise<Warranty>;
  save(record: Warranty): Promise<Warranty>;
}
