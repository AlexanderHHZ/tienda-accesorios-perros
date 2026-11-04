import type { RequestStatus } from '../api/contracts';
import { statusLabels } from '../utils/presentation';

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className="status-badge" data-status={status}>
      {statusLabels[status]}
    </span>
  );
}
