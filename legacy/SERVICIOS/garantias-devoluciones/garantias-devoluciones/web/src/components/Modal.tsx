import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  description: string;
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** El diálogo nativo confina el foco y hace inerte el contenido que queda detrás. */
export function Modal({ title, description, busy = false, onClose, children }: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className="request-dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-6 py-6 sm:px-8">
          <div>
            <h2 id={`${id}-title`} className="text-xl font-semibold tracking-tight">
              {title}
            </h2>
            <p id={`${id}-description`} className="mt-2 text-sm leading-6 text-muted">
              {description}
            </p>
          </div>
          <button
            type="button"
            className="icon-button -mr-2 -mt-1"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar diálogo"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto">{children}</div>
      </div>
    </dialog>
  );
}
