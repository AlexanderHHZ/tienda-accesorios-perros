import type { SaleReturn } from '../domain/returns/return.js';
import type { Warranty } from '../domain/warranties/warranty.js';

/** Traduce nombres del modelo a JSON público; no incorpora columnas nuevas. */
export function serializeReturn(record: SaleReturn) {
  return {
    id: record.id,
    saleId: record.id_venta,
    productId: record.id_producto,
    quantity: record.cantidad,
    reason: record.motivo,
    date: record.fecha,
    status: record.estado,
  };
}

export function serializeWarranty(record: Warranty) {
  return {
    id: record.id,
    saleId: record.id_venta,
    productId: record.id_producto,
    requestDate: record.fecha_solicitud,
    reason: record.motivo,
    status: record.estado,
    resolution: record.resolucion,
  };
}
