import type { Product, ProductRepository } from '../../domain/products/product.js';

export class InMemoryProductRepository implements ProductRepository {
  constructor(private readonly records: readonly Product[]) {}

  async findById(id: number): Promise<Product | null> {
    const record = this.records.find((item) => item.id === id);
    return record ? { ...record } : null;
  }
}
