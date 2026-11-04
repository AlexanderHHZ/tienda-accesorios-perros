import type { Sale, SaleDetail, SaleRepository } from '../../domain/sales/sale.js';

export class InMemorySaleRepository implements SaleRepository {
  constructor(
    private readonly sales: readonly Sale[],
    private readonly details: readonly SaleDetail[],
  ) {}

  async findById(id: number): Promise<Sale | null> {
    const record = this.sales.find((item) => item.id === id);
    return record ? { ...record } : null;
  }

  async findDetails(saleId: number, productId: number): Promise<readonly SaleDetail[]> {
    return this.details
      .filter((item) => item.id_venta === saleId && item.id_producto === productId)
      .map((item) => ({ ...item }));
  }
}
