import { Check, LoaderCircle, TriangleAlert } from 'lucide-react';
import { Button } from './button';

export function ErrorNotice({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
    >
      <div className="flex items-start gap-3">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p className="leading-6">{message}</p>
      </div>
      {retry ? (
        <Button variant="secondary" onClick={retry} className="mt-3">
          Volver a intentar
        </Button>
      ) : null}
    </div>
  );
}

export function LoadingState() {
  return (
    <div
      role="status"
      className="flex min-h-48 flex-col items-center justify-center gap-3 text-sm text-muted"
    >
      <LoaderCircle
        aria-hidden="true"
        className="size-6 animate-spin text-accent motion-reduce:animate-none"
      />{' '}
      Cargando empaquetados…
    </div>
  );
}

export function SuccessNotice({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
    >
      <Check aria-hidden="true" className="size-4 shrink-0" />
      {message}
    </div>
  );
}
