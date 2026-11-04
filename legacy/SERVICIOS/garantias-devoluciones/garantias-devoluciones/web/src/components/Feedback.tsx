import { AlertCircle, CheckCircle2, LoaderCircle, X } from 'lucide-react';
import type { ApiError } from '../api/client';

export function ErrorNotice({
  error,
  retry,
  mutation = false,
}: {
  error: ApiError;
  retry?: () => void;
  mutation?: boolean;
}) {
  const uncertain =
    mutation && ['CONNECTION_ERROR', 'SERVICE_ERROR', 'INVALID_RESPONSE'].includes(error.code);
  return (
    <div role="alert" className="notice border-rose-200 bg-rose-50 text-rose-900">
      <AlertCircle size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p>{error.message}</p>
        {uncertain ? (
          <p className="mt-1 text-xs leading-5">
            No se pudo confirmar el resultado. Consulta el listado antes de volver a enviar la
            solicitud.
          </p>
        ) : null}
        {error.details.length ? (
          <ul className="mt-1 list-inside list-disc text-xs leading-5">
            {error.details.map((detail, index) => (
              <li key={`${detail.path}-${index}`}>{detail.message}</li>
            ))}
          </ul>
        ) : null}
      </div>
      {retry ? (
        <button
          type="button"
          className="shrink-0 font-semibold underline underline-offset-4"
          onClick={retry}
        >
          Reintentar
        </button>
      ) : null}
    </div>
  );
}

export function SuccessNotice({ message, dismiss }: { message: string; dismiss: () => void }) {
  return (
    <div role="status" className="notice border-brand-100 bg-brand-50 text-brand-800">
      <CheckCircle2 size={18} aria-hidden="true" className="shrink-0" />
      <p className="flex-1">{message}</p>
      <button type="button" onClick={dismiss} aria-label="Cerrar mensaje" className="rounded p-0.5">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div
      role="status"
      className="flex min-h-52 items-center justify-center gap-3 text-sm text-muted"
    >
      <LoaderCircle size={19} aria-hidden="true" className="animate-spin" />
      {label}
    </div>
  );
}
