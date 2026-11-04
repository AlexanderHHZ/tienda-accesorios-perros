import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { EmpaquetadosPage } from '@/types/empaquetado';
import { Button } from '@/components/ui/button';

type Props = {
  meta: EmpaquetadosPage['meta'];
  busy: boolean;
  onPage: (page: number) => void;
  onLimit: (limit: number) => void;
};

export function Pagination({ meta, busy, onPage, onLimit }: Props) {
  const start =
    meta.total === 0 || meta.page > meta.totalPages ? 0 : (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);
  return (
    <div className="flex flex-col gap-3 border-t border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-xs text-muted">
        <span className="font-semibold text-ink">
          {start}–{start ? end : 0}
        </span>{' '}
        de {meta.total} registros
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[11px] text-muted">
          Por página
          <select
            value={meta.limit}
            onChange={(event) => onLimit(Number(event.target.value))}
            className="min-h-10 rounded-lg border border-line bg-white px-2 text-xs text-ink"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            aria-label="Página anterior"
            disabled={busy || meta.page <= 1}
            onClick={() => onPage(meta.page - 1)}
            className="size-10 min-h-10 p-0"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-xs tabular-nums text-muted">
            {meta.page} / {Math.max(1, meta.totalPages)}
          </span>
          <Button
            variant="secondary"
            aria-label="Página siguiente"
            disabled={busy || meta.page >= meta.totalPages}
            onClick={() => onPage(meta.page + 1)}
            className="size-10 min-h-10 p-0"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
