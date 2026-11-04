import { DomainError } from '../errors.js';
import { assertStatusTransition, type ProcessStatus } from '../process-status.js';

/** GARANTIAS no identifica unidades individuales y no contiene cantidad. */
export interface Warranty {
  readonly id: number;
  readonly id_venta: number;
  readonly id_producto: number;
  readonly fecha_solicitud: string;
  readonly motivo: string;
  readonly estado: ProcessStatus;
  readonly resolucion: string;
}

export type NewWarranty = Omit<Warranty, 'id'>;

export function assertNoActiveWarranty(records: readonly Warranty[]): void {
  if (records.some((record) => record.estado === 'PENDING' || record.estado === 'APPROVED')) {
    throw new DomainError(
      'ACTIVE_WARRANTY_ALREADY_EXISTS',
      'Ya existe una garantía activa para esta venta y producto.',
    );
  }
}

/** La resolución puede anticiparse; completar exige dejar constancia del resultado. */
export function changeWarrantyStatus(
  record: Warranty,
  next: ProcessStatus,
  resolution?: string,
): Warranty {
  assertStatusTransition(record.estado, next);
  const normalized = resolution === undefined ? record.resolucion : resolution.trim();
  if (resolution !== undefined && !normalized) {
    throw new DomainError('INVALID_RESOLUTION', 'La resolución no puede estar vacía.');
  }
  if (next === 'COMPLETED' && !normalized) {
    throw new DomainError('RESOLUTION_REQUIRED', 'Para completar la garantía debes registrar una resolución.');
  }
  return { ...record, estado: next, resolucion: normalized };
}
