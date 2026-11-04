'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type Props = {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
  busy?: boolean;
};

export function Modal({ title, description, onClose, children, busy = false }: Props) {
  const opener = useRef<HTMLElement | null>(null);
  const content = useRef<HTMLDivElement | null>(null);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/45 backdrop-blur-xs" />
        <Dialog.Content
          ref={content}
          onOpenAutoFocus={(event) => {
            if (document.activeElement instanceof HTMLElement)
              opener.current = document.activeElement;
            const initial = content.current?.querySelector<HTMLElement>('[data-initial-focus]');
            if (initial) {
              event.preventDefault();
              initial.focus();
            }
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus();
          }}
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (busy) event.preventDefault();
          }}
          className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
        >
          <div className="mb-6 pr-9">
            <Dialog.Title className="text-xl font-bold tracking-tight text-ink">
              {title}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-muted">
              {description}
            </Dialog.Description>
          </div>
          <Dialog.Close
            disabled={busy}
            aria-label="Cerrar ventana"
            className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-lg text-muted hover:bg-stone-100 disabled:opacity-40"
          >
            <X className="size-5" />
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
