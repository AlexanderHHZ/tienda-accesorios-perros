import { DomainError } from './errors.js';

export const PROCESS_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'] as const;
export type ProcessStatus = (typeof PROCESS_STATUSES)[number];

const transitions: Readonly<Record<ProcessStatus, readonly ProcessStatus[]>> = {
  PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: ['COMPLETED'],
  REJECTED: [],
  COMPLETED: [],
};

export function assertStatusTransition(current: ProcessStatus, next: ProcessStatus): void {
  if (!transitions[current].includes(next)) {
    throw new DomainError(
      'INVALID_STATUS_TRANSITION',
      `No se permite cambiar el estado de ${current} a ${next}.`,
    );
  }
}
