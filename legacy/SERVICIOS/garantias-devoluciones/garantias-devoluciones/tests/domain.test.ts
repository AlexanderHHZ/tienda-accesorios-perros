import { describe, expect, it } from 'vitest';
import { assertStatusTransition, PROCESS_STATUSES } from '../src/domain/process-status.js';

describe('Matriz completa de estados', () => {
  const allowed = new Set(['PENDING:APPROVED', 'PENDING:REJECTED', 'APPROVED:COMPLETED']);
  for (const current of PROCESS_STATUSES) {
    for (const next of PROCESS_STATUSES) {
      it(`${current} → ${next}`, () => {
        const operation = () => assertStatusTransition(current, next);
        if (allowed.has(`${current}:${next}`)) expect(operation).not.toThrow();
        else expect(operation).toThrow(expect.objectContaining({ code: 'INVALID_STATUS_TRANSITION' }));
      });
    }
  }
});
