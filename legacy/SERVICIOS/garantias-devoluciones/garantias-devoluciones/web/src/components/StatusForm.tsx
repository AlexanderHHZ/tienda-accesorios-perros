import { useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, LoaderCircle } from 'lucide-react';

import { asApiError, type ApiError } from '../api/client';
import {
  statusSchema,
  type RequestKind,
  type RequestRecord,
  type RequestStatus,
} from '../api/contracts';
import { returnsApi, warrantiesApi } from '../api/requests';
import { formText } from '../utils/forms';
import { nextStatuses, statusLabels } from '../utils/presentation';
import { ErrorNotice } from './Feedback';

interface StatusFormProps {
  kind: RequestKind;
  record: RequestRecord;
  busy: boolean;
  setBusy: (busy: boolean) => void;
  onUpdated: (record: RequestRecord) => void;
  onBack: () => void;
}

export function StatusForm({
  kind,
  record,
  busy,
  setBusy,
  onUpdated,
  onBack,
}: StatusFormProps) {
  const [status, setStatus] = useState<RequestStatus | ''>('');
  const [error, setError] = useState<ApiError | null>(null);
  const [validation, setValidation] = useState<string | null>(null);

  const submitting = useRef(false);

  const currentResolution =
    'resolution' in record ? record.resolution : '';

  const resolutionRequired =
    status === 'COMPLETED' || Boolean(currentResolution);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting.current) return;

    const data = new FormData(event.currentTarget);
    const selected = statusSchema.safeParse(data.get('status'));
    const resolution = formText(data, 'resolution');

    setError(null);
    setValidation(null);

    if (
      !selected.success ||
      !nextStatuses[record.status].includes(selected.data)
    ) {
      setValidation('Selecciona uno de los estados disponibles.');
      return;
    }

    if (kind === 'warranties' && resolutionRequired && !resolution) {
      setValidation(
        'Escribe una resolución; no puede contener solo espacios.',
      );
      return;
    }

    submitting.current = true;
    setBusy(true);

    try {
      const updated =
        kind === 'returns'
          ? await returnsApi.changeStatus(record.id, {
              status: selected.data,
            })
          : await warrantiesApi.changeStatus(record.id, {
              status: selected.data,
              ...(resolution ? { resolution } : {}),
            });

      onUpdated(updated);
    } catch (failure) {
      setError(asApiError(failure));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <div className="space-y-5 px-6 py-5 sm:px-8">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">
            Cambiar estado
          </h3>

          <p className="mt-1 text-sm leading-6 text-muted">
            Selecciona el siguiente paso de esta solicitud.
          </p>
        </div>

        {error ? <ErrorNotice error={error} mutation /> : null}

        {validation ? (
          <p role="alert" className="field-error">
            {validation}
          </p>
        ) : null}

        <fieldset
          disabled={busy}
          className="space-y-4 disabled:opacity-65"
        >
          <label className="field-label">
            Nuevo estado

            <select
              name="status"
              required
              className="field-input"
              value={status}
              onChange={(event) => {
                const value = statusSchema.safeParse(
                  event.currentTarget.value,
                );

                setStatus(value.success ? value.data : '');
              }}
            >
              <option value="" disabled>
                Selecciona un estado
              </option>

              {nextStatuses[record.status].map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value]}
                </option>
              ))}
            </select>
          </label>

          {kind === 'warranties' ? (
            <label className="field-label">
              Resolución

              {!resolutionRequired ? (
                <span className="font-normal text-muted">
                  {' '}
                  (opcional)
                </span>
              ) : null}

              <textarea
                name="resolution"
                rows={3}
                maxLength={4000}
                required={resolutionRequired}
                defaultValue={currentResolution}
                className="field-input resize-none"
                placeholder="Describe cómo se resolvió la garantía…"
              />

              <span className="field-hint">
                Obligatoria al completar la garantía. Hasta 4,000
                caracteres.
              </span>
            </label>
          ) : null}
        </fieldset>
      </div>

      <footer className="modal-footer">
        <button
          type="button"
          className="button-secondary"
          onClick={onBack}
          disabled={busy}
        >
          <ArrowLeft
            size={17}
            strokeWidth={2}
            aria-hidden="true"
          />
          Volver
        </button>

        <button
          type="submit"
          className="button-primary"
          disabled={busy || !status}
        >
          {busy ? (
            <LoaderCircle
              size={17}
              strokeWidth={2}
              className="animate-spin"
              aria-hidden="true"
            />
          ) : null}

          {busy ? 'Guardando…' : 'Guardar cambio'}
        </button>
      </footer>
    </form>
  );
}
