export interface Sale {
  readonly id: number;
  readonly id_pedido: number;
  readonly id_cliente: number;
  readonly fecha: string;
  readonly total: number;
}

export interface SaleDetail {
  readonly id: number;
  readonly id_venta: number;
  readonly id_producto: number;
  readonly cantidad: number;
  readonly precio_unitario: number;
}

/** Este módulo consulta ventas y detalles; no crea ni modifica ventas ajenas. */
export interface SaleRepository {
  findById(id: number): Promise<Sale | null>;
  findDetails(saleId: number, productId: number): Promise<readonly SaleDetail[]>;
}
