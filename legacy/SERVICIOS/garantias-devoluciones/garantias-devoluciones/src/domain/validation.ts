import { DomainError } from './errors.js';

export function assertIdentifier(value: number): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new DomainError('INVALID_ID', 'El identificador debe ser un entero positivo seguro.');
  }
}

export function assertQuantity(value: number): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new DomainError('INVALID_QUANTITY', 'La cantidad debe ser un entero mayor que cero.');
  }
}

export function normalizeReason(reason: string): string {
  const normalized = reason.trim();
  if (!normalized) {
    throw new DomainError('INVALID_REASON', 'El motivo no puede estar vacío.');
  }
  return normalized;
}
