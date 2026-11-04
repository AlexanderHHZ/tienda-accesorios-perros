import { DomainError } from '../errors.js';
import { assertStatusTransition, type ProcessStatus } from '../process-status.js';
import { assertQuantity } from '../validation.js';

/** Una fila de DEVOLUCIONES_VENTA, sin campos de garantías ni metadatos adicionales. */
export interface SaleReturn {
  readonly id: number;
  readonly id_venta: number;
  readonly id_producto: number;
  readonly cantidad: number;
  readonly motivo: string;
  readonly fecha: string;
  readonly estado: ProcessStatus;
}

export type NewReturn = Omit<SaleReturn, 'id'>;

/** Pendientes y aprobadas reservan unidades; completadas las consumen definitivamente. */
export function assertReturnCapacity(
  purchasedQuantity: number,
  previousReturns: readonly SaleReturn[],
  requestedQuantity: number,
): void {
  assertQuantity(requestedQuantity);
  const reserved = previousReturns
    .filter((record) => record.estado !== 'REJECTED')
    .reduce((total, record) => total + record.cantidad, 0);
  const available = Math.max(0, purchasedQuantity - reserved);
  if (requestedQuantity > available) {
    throw new DomainError(
      'RETURN_QUANTITY_EXCEEDED',
      `La cantidad solicitada supera la disponible para devolución. Unidades disponibles: ${available}.`,
    );
  }
}

export function changeReturnStatus(record: SaleReturn, next: ProcessStatus): SaleReturn {
  assertStatusTransition(record.estado, next);
  return { ...record, estado: next };
}
