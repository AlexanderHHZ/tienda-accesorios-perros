import { useRef, useState, type FormEvent } from 'react';
import { LoaderCircle } from 'lucide-react';
import { asApiError, type ApiError } from '../api/client';
import type { RequestKind, RequestRecord } from '../api/contracts';
import { returnsApi, warrantiesApi } from '../api/requests';
import { areas } from '../utils/presentation';
import { formText, positiveInteger } from '../utils/forms';
import { ErrorNotice } from './Feedback';
import { Modal } from './Modal';

export function CreateRequestDialog({
  kind,
  onClose,
  onCreated,
}: {
  kind: RequestKind;
  onClose: () => void;
  onCreated: (record: RequestRecord) => void;
}) {
  const area = areas[kind];
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [validation, setValidation] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const data = new FormData(event.currentTarget);
    const saleId = positiveInteger(data.get('saleId'));
    const productId = positiveInteger(data.get('productId'));
    const quantity = kind === 'returns' ? positiveInteger(data.get('quantity')) : null;
    const reason = formText(data, 'reason');
    setError(null);
    setValidation(null);
    if (saleId === null || productId === null || (kind === 'returns' && quantity === null)) {
      setValidation(
        kind === 'returns'
          ? 'Escribe números enteros positivos para los identificadores y la cantidad.'
          : 'Escribe números enteros positivos para los identificadores.',
      );
      return;
    }
    if (!reason) {
      setValidation('Escribe un motivo; no puede contener solo espacios.');
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      const common = { saleId, productId, reason };
      // Cada POST se construye explícitamente: garantías nunca recibe quantity.
      const record =
        kind === 'returns' && quantity !== null
          ? await returnsApi.create({ ...common, quantity })
          : await warrantiesApi.create(common);
      onCreated(record);
    } catch (failure) {
      setError(asApiError(failure));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <Modal
      title={area.createLabel}
      description="Ingresa los datos de la venta para registrar tu solicitud."
      onClose={onClose}
      busy={busy}
    >
      <form
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <div className="space-y-6 px-6 py-7 sm:px-8">
          {error ? <ErrorNotice error={error} mutation /> : null}
          {validation ? (
            <p role="alert" className="field-error">
              {validation}
            </p>
          ) : null}
          <fieldset disabled={busy} className="space-y-6 disabled:opacity-65">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="field-label">
                ID de venta
                <input
                  autoFocus
                  name="saleId"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]+"
                  required
                  maxLength={16}
                  placeholder="Ej. 1001"
                  className="field-input"
                />
              </label>
              <label className="field-label">
                ID de producto
                <input
                  name="productId"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]+"
                  required
                  maxLength={16}
                  placeholder={kind === 'returns' ? 'Ej. 102' : 'Ej. 101'}
                  className="field-input"
                />
              </label>
            </div>
            <p className="-mt-2 text-xs leading-5 text-muted">
              El producto debe pertenecer a la venta indicada.
            </p>
            {kind === 'returns' ? (
              <label className="field-label sm:max-w-[calc(50%-0.625rem)]">
                Cantidad
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  max={Number.MAX_SAFE_INTEGER}
                  required
                  defaultValue="1"
                  className="field-input"
                />
              </label>
            ) : null}
            <label className="field-label">
              Motivo
              <textarea
                name="reason"
                required
                maxLength={2000}
                rows={4}
                placeholder={`Describe el motivo de la ${area.singular}…`}
                className="field-input min-h-30 resize-y"
              />
              <span className="field-hint">Hasta 2,000 caracteres.</span>
            </label>
          </fieldset>
        </div>
        <footer className="modal-footer">
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="submit" className="button-primary" disabled={busy}>
            {busy ? <LoaderCircle size={16} aria-hidden="true" className="animate-spin" /> : null}
            {busy ? 'Registrando…' : `Registrar ${area.singular}`}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
