export type DomainErrorCode =
  | 'SALE_NOT_FOUND'
  | 'PRODUCT_NOT_FOUND'
  | 'PRODUCT_NOT_IN_SALE'
  | 'INVALID_ID'
  | 'INVALID_QUANTITY'
  | 'INVALID_REASON'
  | 'INVALID_RESOLUTION'
  | 'RESOLUTION_REQUIRED'
  | 'RETURN_QUANTITY_EXCEEDED'
  | 'RETURN_NOT_FOUND'
  | 'WARRANTY_NOT_FOUND'
  | 'ACTIVE_WARRANTY_ALREADY_EXISTS'
  | 'INVALID_STATUS_TRANSITION';

/** Describe un rechazo del negocio; su traducción a HTTP pertenece al adaptador. */
export class DomainError extends Error {
  constructor(public readonly code: DomainErrorCode, message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
