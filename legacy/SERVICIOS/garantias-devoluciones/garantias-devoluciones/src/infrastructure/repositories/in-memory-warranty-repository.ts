import { DomainError } from '../../domain/errors.js';
import type { WarrantyRepository } from '../../domain/warranties/warranty-repository.js';
import type { NewWarranty, Warranty } from '../../domain/warranties/warranty.js';

export class InMemoryWarrantyRepository implements WarrantyRepository {
  constructor(private readonly records: Warranty[]) {}

  async findAll(): Promise<readonly Warranty[]> {
    return this.records.map((item) => ({ ...item })).sort((a, b) => a.id - b.id);
  }

  async findById(id: number): Promise<Warranty | null> {
    const record = this.records.find((item) => item.id === id);
    return record ? { ...record } : null;
  }

  async findBySaleAndProduct(saleId: number, productId: number): Promise<readonly Warranty[]> {
    return this.records
      .filter((item) => item.id_venta === saleId && item.id_producto === productId)
      .map((item) => ({ ...item }));
  }

  async create(input: NewWarranty): Promise<Warranty> {
    const id = this.records.reduce((maximum, record) => Math.max(maximum, record.id), 0) + 1;
    if (!Number.isSafeInteger(id)) throw new Error('Se agotó el rango de identificadores.');
    const record = { ...input, id };
    this.records.push(record);
    return { ...record };
  }

  async save(record: Warranty): Promise<Warranty> {
    const index = this.records.findIndex((item) => item.id === record.id);
    if (index < 0) throw new DomainError('WARRANTY_NOT_FOUND', 'La garantía no existe.');
    this.records[index] = { ...record };
    return { ...record };
  }
}
