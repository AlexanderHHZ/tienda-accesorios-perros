'use client';

import { useEffect, useState } from 'react';
import { LoaderCircle, Plus, RotateCw } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { ErrorNotice, LoadingState, SuccessNotice } from '@/components/ui/feedback';
import { useEmpaquetados } from '@/hooks/use-empaquetados';
import { errorMessage } from '@/services/http-client';
import type { ActivePanel, Filters as FilterValues } from '@/types/empaquetado';
import { Summary } from './summary';
import { Filters } from './filters';
import { RecordList } from './record-list';
import { Pagination } from './pagination';
import { EmptyState } from './empty-state';
import { RecordDialog } from './record-dialog';

const initialFilters: FilterValues = {
  q: '',
  tamano: '',
  tipoEmpacado: '',
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  order: 'desc',
};

export function EmpaquetadosDashboard() {
  const [filters, setFilters] = useState(initialFilters);
  const [panel, setPanel] = useState<ActivePanel | null>(null);
  const [notice, setNotice] = useState('');
  const { data, error, isLoading, isSearching, mutate } = useEmpaquetados(filters);
  const filtered = Boolean(filters.q || filters.tamano || filters.tipoEmpacado);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 6_000);
    return () => clearTimeout(timer);
  }, [notice]);

  function refresh() {
    void mutate().catch(() => undefined);
  }
  function updateFilters(values: Partial<FilterValues>) {
    setFilters((current) => ({ ...current, ...values, page: 1 }));
  }
  function complete(kind: 'create' | 'edit' | 'delete') {
    setPanel(null);
    setNotice(
      kind === 'create'
        ? 'Empaquetado creado correctamente.'
        : kind === 'edit'
          ? 'Cambios guardados correctamente.'
          : 'Empaquetado eliminado correctamente.',
    );
    if (kind === 'create') setFilters({ ...initialFilters, limit: filters.limit });
    if (kind === 'delete' && data?.data.length === 1 && filters.page > 1)
      setFilters((current) => ({ ...current, page: current.page - 1 }));
    // Una revalidación fallida no convierte una escritura confirmada en un fallo de guardado.
    refresh();
  }

  return (
    <AppShell
      onGuide={() => setPanel({ kind: 'guide' })}
      connected={Boolean(data) && !error}
      loading={isLoading}
    >
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-3 text-[10px] font-bold tracking-[0.19em] text-accent">
            CONTROL DE EMPAQUETADO
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-[38px] sm:leading-tight">
            Cada paquete, en su lugar.
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
            Organiza pesos, medidas y tipos de empaque desde un solo lugar.
          </p>
        </div>
        <Button
          onClick={() => setPanel({ kind: 'create' })}
          className="shrink-0 self-start sm:self-auto"
        >
          <Plus className="size-4" aria-hidden="true" />
          Nuevo empaquetado
        </Button>
      </div>
      <Summary meta={error ? undefined : data?.meta} />
      <p className="mb-7 mt-3 text-[10px] text-muted">
        Resumen de todos los registros que coinciden con tus filtros.
      </p>
      {notice ? (
        <div className="mb-4">
          <SuccessNotice message={notice} />
        </div>
      ) : null}
      <section
        id="registros"
        className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_2px_6px_#252a2803]"
        aria-label="Registro de empaquetados"
        aria-busy={isSearching}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-5">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold tracking-tight">Empaquetados</h2>
            {data && !error ? (
              <span className="rounded-md border border-line bg-canvas px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted">
                {data.meta.total}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {isSearching ? (
              <span className="flex items-center gap-1.5 text-[10px] text-muted" role="status">
                <LoaderCircle
                  className="size-3 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
                Actualizando
              </span>
            ) : null}
            <button
              onClick={refresh}
              disabled={isSearching}
              aria-label="Actualizar registros"
              title="Actualizar registros"
              className="flex size-10 items-center justify-center rounded-lg border border-line text-muted hover:bg-canvas disabled:opacity-40"
            >
              <RotateCw className="size-4" />
            </button>
          </div>
        </div>
        <Filters filters={filters} onChange={updateFilters} />
        {error ? (
          <div className="p-5">
            <ErrorNotice message={errorMessage(error)} retry={refresh} />
          </div>
        ) : isLoading && !data ? (
          <LoadingState />
        ) : data?.data.length ? (
          <RecordList
            items={data.data}
            onView={(item) => setPanel({ kind: 'view', id: item.id })}
            onEdit={(item) => setPanel({ kind: 'edit', item })}
            onDelete={(item) => setPanel({ kind: 'delete', item })}
          />
        ) : (
          <EmptyState
            filtered={filtered || filters.page > 1}
            onCreate={() => setPanel({ kind: 'create' })}
            onReset={() => setFilters(initialFilters)}
          />
        )}
        {data && !error ? (
          <Pagination
            meta={data.meta}
            busy={isSearching}
            onPage={(page) => setFilters((current) => ({ ...current, page }))}
            onLimit={(limit) => updateFilters({ limit })}
          />
        ) : null}
      </section>
      <footer className="mt-5 flex flex-wrap justify-between gap-2 text-[10px] text-muted">
        <span>Un registro claro. Una operación en orden.</span>
        <span>Peso en kg · Dimensiones en cm</span>
      </footer>
      {panel ? (
        <RecordDialog
          key={panel.kind}
          panel={panel}
          onClose={() => {
            setPanel(null);
            refresh();
          }}
          onEdit={(item) => setPanel({ kind: 'edit', item })}
          onSuccess={complete}
        />
      ) : null}
    </AppShell>
  );
}
