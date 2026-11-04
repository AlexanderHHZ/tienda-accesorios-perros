import { Eye, Inbox, SearchX } from 'lucide-react';

import type { RequestKind, RequestRecord } from '../api/contracts';
import { areas, formatDate, requestDate } from '../utils/presentation';
import { StatusBadge } from './StatusBadge';

interface RequestTableProps {
  kind: RequestKind;
  records: readonly RequestRecord[];
  searching: boolean;
  open: (id: number) => void;
  clearSearch: () => void;
}

export function RequestTable({
  kind,
  records,
  searching,
  open,
  clearSearch,
}: RequestTableProps) {
  const area = areas[kind];

  if (!records.length) {
    const Icon = searching ? SearchX : Inbox;

    return (
      <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
        <Icon
          size={32}
          strokeWidth={1.8}
          aria-hidden="true"
          className="mb-4 text-muted"
        />

        <p className="font-medium">
          {searching
            ? 'Sin coincidencias'
            : `Aún no hay ${area.title.toLowerCase()}`}
        </p>

        <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
          {searching
            ? 'Prueba con otro ID, venta, producto o motivo.'
            : `Registra una nueva ${area.singular} para comenzar.`}
        </p>

        {searching ? (
          <button
            type="button"
            className="mt-4 text-sm font-semibold text-brand-700 underline underline-offset-4"
            onClick={clearSearch}
          >
            Limpiar búsqueda
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="records-table">
          <caption className="sr-only">
            Listado de {area.title.toLowerCase()}
          </caption>

          <thead>
            <tr>
              <th scope="col">Solicitud</th>
              <th scope="col">Venta</th>
              <th scope="col">Producto</th>

              {kind === 'returns' ? <th scope="col">Cantidad</th> : null}

              <th scope="col" className="w-full">
                Motivo
              </th>

              <th scope="col">Fecha</th>
              <th scope="col">Estado</th>

              <th scope="col">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>
                  <button
                    type="button"
                    className="font-semibold text-brand-700 hover:underline"
                    onClick={() => open(record.id)}
                    aria-label={`Ver ${area.singular} #${record.id}`}
                  >
                    #{record.id}
                  </button>
                </td>

                <td className="tabular-nums">{record.saleId}</td>

                <td className="tabular-nums">{record.productId}</td>

                {kind === 'returns' && 'quantity' in record ? (
                  <td className="tabular-nums">{record.quantity}</td>
                ) : null}

                <td>
                  <p
                    className="max-w-[20rem] truncate text-muted"
                    title={record.reason}
                  >
                    {record.reason}
                  </p>
                </td>

                <td className="whitespace-nowrap text-xs text-muted">
                  <time dateTime={requestDate(record)}>
                    {formatDate(requestDate(record))}
                  </time>
                </td>

                <td>
                  <StatusBadge status={record.status} />
                </td>

                <td>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Abrir detalle de ${area.singular} #${record.id}`}
                    onClick={() => open(record.id)}
                  >
                    <Eye
                      size={18}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul
        className="divide-y divide-line lg:hidden"
        aria-label={`Listado de ${area.title.toLowerCase()}`}
      >
        {records.map((record) => (
          <li key={record.id}>
            <button
              type="button"
              className="group w-full px-5 py-5 text-left transition-colors hover:bg-brand-50/50"
              onClick={() => open(record.id)}
              aria-label={`Ver ${area.singular} #${record.id}`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-brand-700">
                  #{record.id}
                </span>

                <StatusBadge status={record.status} />
              </span>

              <span className="mt-3 block truncate text-sm text-ink">
                {record.reason}
              </span>

              <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                <span>Venta {record.saleId}</span>
                <span>Producto {record.productId}</span>

                {kind === 'returns' && 'quantity' in record ? (
                  <span>Cantidad {record.quantity}</span>
                ) : null}
              </span>

              <span className="mt-4 flex items-center justify-between text-xs text-muted">
                <time dateTime={requestDate(record)}>
                  {formatDate(requestDate(record))}
                </time>

                <Eye
                  size={18}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="text-brand-700"
                />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
