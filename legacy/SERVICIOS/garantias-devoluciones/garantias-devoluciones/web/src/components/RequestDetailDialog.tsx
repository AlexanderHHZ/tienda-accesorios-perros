import { useCallback, useState } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';

import type { RequestKind, RequestRecord } from '../api/contracts';
import { getRequest } from '../api/requests';
import { useResource } from '../hooks/useResource';
import { formatDate, nextStatuses, requestDate } from '../utils/presentation';
import { ErrorNotice, LoadingState, SuccessNotice } from './Feedback';
import { Modal } from './Modal';
import { StatusBadge } from './StatusBadge';
import { StatusForm } from './StatusForm';

type DetailStep = 'details' | 'status';

export function RequestDetailDialog({
  kind,
  id,
  onClose,
  onUpdated,
}: {
  kind: RequestKind;
  id: number;
  onClose: () => void;
  onUpdated: (record: RequestRecord) => void;
}) {
  const load = useCallback(
    (signal: AbortSignal) => getRequest(kind, id, signal),
    [kind, id],
  );

  const {
    data: record,
    setData,
    error,
    loading,
    reload,
  } = useResource(load);

  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<DetailStep>('details');

  const title = `${kind === 'returns' ? 'Devolución' : 'Garantía'} #${id}`;

  function updated(value: RequestRecord) {
    setData(value);
    setSuccess(true);
    setStep('details');
    onUpdated(value);
  }

  return (
    <Modal
      title={title}
      description="Consulta los datos y da seguimiento a la solicitud."
      onClose={onClose}
      busy={busy}
    >
      {loading ? (
        <LoadingState label="Consultando solicitud…" />
      ) : error ? (
        <div className="p-6 sm:p-8">
          <ErrorNotice
            error={error}
            retry={() => {
              void reload();
            }}
          />
        </div>
      ) : record ? (
        step === 'details' ? (
          <>
            <div className="space-y-5 px-6 py-5 sm:px-8">
              {success ? (
                <SuccessNotice
                  message="El estado se actualizó correctamente."
                  dismiss={() => setSuccess(false)}
                />
              ) : null}

              <div className="flex items-center justify-between gap-4">
                <StatusBadge status={record.status} />

                <button
                  type="button"
                  className="flex items-center gap-2 rounded text-xs font-medium text-muted hover:text-brand-700"
                  onClick={() => {
                    setSuccess(false);
                    void reload();
                  }}
                  disabled={busy}
                >
                  <RefreshCw
                    size={15}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  Actualizar
                </button>
              </div>

              <dl
                className={`grid gap-x-6 gap-y-4 border-y border-line py-4 ${
                  kind === 'returns'
                    ? 'grid-cols-2 sm:grid-cols-3'
                    : 'grid-cols-2'
                }`}
              >
                <div>
                  <dt className="text-xs text-muted">ID de venta</dt>
                  <dd className="mt-1 text-sm font-medium tabular-nums">
                    {record.saleId}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted">ID de producto</dt>
                  <dd className="mt-1 text-sm font-medium tabular-nums">
                    {record.productId}
                  </dd>
                </div>

                {kind === 'returns' && 'quantity' in record ? (
                  <div>
                    <dt className="text-xs text-muted">Cantidad</dt>
                    <dd className="mt-1 text-sm font-medium tabular-nums">
                      {record.quantity}
                    </dd>
                  </div>
                ) : null}

                <div className="col-span-full">
                  <dt className="text-xs text-muted">Fecha de registro</dt>
                  <dd className="mt-1 text-sm">
                    <time dateTime={requestDate(record)}>
                      {formatDate(requestDate(record), true)}
                    </time>
                  </dd>
                </div>
              </dl>

              <div className="grid gap-5 sm:grid-cols-2">
                <section>
                  <h3 className="text-xs font-medium text-muted">
                    Motivo
                  </h3>

                  <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6">
                    {record.reason}
                  </p>
                </section>

                {kind === 'warranties' && 'resolution' in record ? (
                  <section>
                    <h3 className="text-xs font-medium text-muted">
                      Resolución registrada
                    </h3>

                    <p
                      className={`mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 ${
                        record.resolution ? '' : 'text-muted'
                      }`}
                    >
                      {record.resolution || 'Sin resolución registrada.'}
                    </p>
                  </section>
                ) : null}
              </div>
            </div>

            {nextStatuses[record.status].length ? (
              <footer className="modal-footer">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={onClose}
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  className="button-primary"
                  onClick={() => setStep('status')}
                >
                  Cambiar estado
                  <ArrowRight
                    size={17}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </button>
              </footer>
            ) : (
              <>
                <p className="border-t border-line px-6 py-4 text-sm leading-6 text-muted sm:px-8">
                  Esta solicitud está cerrada. Su estado no admite cambios.
                </p>

                <footer className="modal-footer">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={onClose}
                  >
                    Cerrar
                  </button>
                </footer>
              </>
            )}
          </>
        ) : (
          <StatusForm
            key={`${record.id}-${record.status}`}
            kind={kind}
            record={record}
            busy={busy}
            setBusy={setBusy}
            onUpdated={updated}
            onBack={() => setStep('details')}
          />
        )
      ) : null}
    </Modal>
  );
}
