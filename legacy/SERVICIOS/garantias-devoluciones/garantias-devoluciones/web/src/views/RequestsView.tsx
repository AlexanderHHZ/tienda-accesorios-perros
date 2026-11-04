import { useCallback, useState } from 'react';
import { CirclePlus, RefreshCw, Search, X } from 'lucide-react';

import type { RequestKind, RequestRecord } from '../api/contracts';
import { listRequests } from '../api/requests';
import { CreateRequestDialog } from '../components/CreateRequestDialog';
import { ErrorNotice, LoadingState, SuccessNotice } from '../components/Feedback';
import { RequestDetailDialog } from '../components/RequestDetailDialog';
import { RequestTable } from '../components/RequestTable';
import { useResource } from '../hooks/useResource';
import { areas, matchesSearch } from '../utils/presentation';

export function RequestsView({ kind }: { kind: RequestKind }) {
  const area = areas[kind];

  const load = useCallback(
    (signal: AbortSignal) => listRequests(kind, signal),
    [kind],
  );

  const { data, error, loading, reload } = useResource(load);

  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const records = (data ?? []).filter((record) =>
    matchesSearch(record, search),
  );

  function created(record: RequestRecord) {
    setCreating(false);
    setSearch('');
    setMessage(
      `${kind === 'returns' ? 'Devolución' : 'Garantía'} #${record.id} registrada correctamente.`,
    );

    void reload();
  }

  function updated(record: RequestRecord) {
    setMessage(`Se actualizó el estado de la ${area.singular} #${record.id}.`);
    void reload();
  }

  return (
    <>
      <div className="mb-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            {area.title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted">
            {area.description}
          </p>
        </div>

        <button
          type="button"
          className="button-primary w-full sm:w-auto"
          onClick={() => setCreating(true)}
        >
          <CirclePlus
            size={19}
            strokeWidth={2.1}
            className="shrink-0"
            aria-hidden="true"
          />

          {area.createLabel}
        </button>
      </div>

      {message ? (
        <div className="mb-5">
          <SuccessNotice
            message={message}
            dismiss={() => setMessage(null)}
          />
        </div>
      ) : null}

      <section
        aria-label={`Consulta de ${area.title.toLowerCase()}`}
        aria-busy={loading}
        className="overflow-hidden rounded-xl border border-line bg-white shadow-[0_2px_4px_0_rgb(29_57_37/0.02)]"
      >
        <div className="flex items-center gap-3 border-b border-line p-4 sm:px-5 sm:py-5">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              strokeWidth={2}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="Buscar por ID, venta, producto o motivo…"
              aria-label={`Buscar ${area.title.toLowerCase()}`}
              className="field-input search-input mt-0 pr-10 pl-10 text-xs sm:text-sm"
            />

            {search ? (
              <button
                type="button"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink"
                onClick={() => setSearch('')}
                aria-label="Limpiar búsqueda"
              >
                <X
                  size={17}
                  strokeWidth={2.2}
                  aria-hidden="true"
                />
              </button>
            ) : null}
          </div>

          <button
            type="button"
            className="button-secondary ml-auto shrink-0 px-3 sm:px-4"
            onClick={() => {
              void reload();
            }}
            disabled={loading}
            aria-label="Actualizar listado"
          >
            <RefreshCw
              size={18}
              strokeWidth={2.1}
              aria-hidden="true"
              className={`shrink-0 ${loading ? 'animate-spin' : ''}`}
            />

            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>

        {error ? (
          <div className="p-5">
            <ErrorNotice
              error={error}
              retry={() => {
                void reload();
              }}
            />

            {data ? (
              <p className="mt-2 text-xs text-muted">
                Se muestran los datos de la última consulta correcta.
              </p>
            ) : null}
          </div>
        ) : null}

        {data ? (
          <RequestTable
            kind={kind}
            records={records}
            searching={Boolean(search.trim())}
            open={setSelectedId}
            clearSearch={() => setSearch('')}
          />
        ) : loading ? (
          <LoadingState label={`Cargando ${area.title.toLowerCase()}…`} />
        ) : null}
      </section>

      <p className="mt-4 px-1 text-xs leading-5 text-muted">
        Selecciona una solicitud para consultar sus datos y gestionar su estado.
      </p>

      {creating ? (
        <CreateRequestDialog
          kind={kind}
          onClose={() => setCreating(false)}
          onCreated={created}
        />
      ) : null}

      {selectedId !== null ? (
        <RequestDetailDialog
          kind={kind}
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={updated}
        />
      ) : null}
    </>
  );
}
