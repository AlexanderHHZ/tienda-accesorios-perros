import { DomainError } from '../../domain/errors.js';
import type { ReturnRepository } from '../../domain/returns/return-repository.js';
import type { NewReturn, SaleReturn } from '../../domain/returns/return.js';

export class InMemoryReturnRepository implements ReturnRepository {
  constructor(private readonly records: SaleReturn[]) {}

  async findAll(): Promise<readonly SaleReturn[]> {
    return this.records.map((item) => ({ ...item })).sort((a, b) => a.id - b.id);
  }

  async findById(id: number): Promise<SaleReturn | null> {
    const record = this.records.find((item) => item.id === id);
    return record ? { ...record } : null;
  }

  async findBySaleAndProduct(saleId: number, productId: number): Promise<readonly SaleReturn[]> {
    return this.records
      .filter((item) => item.id_venta === saleId && item.id_producto === productId)
      .map((item) => ({ ...item }));
  }

  async create(input: NewReturn): Promise<SaleReturn> {
    const id = this.records.reduce((maximum, record) => Math.max(maximum, record.id), 0) + 1;
    if (!Number.isSafeInteger(id)) throw new Error('Se agotó el rango de identificadores.');
    const record = { ...input, id };
    this.records.push(record);
    return { ...record };
  }

  async save(record: SaleReturn): Promise<SaleReturn> {
    const index = this.records.findIndex((item) => item.id === record.id);
    if (index < 0) throw new DomainError('RETURN_NOT_FOUND', 'La devolución no existe.');
    this.records[index] = { ...record };
    return { ...record };
  }
}
