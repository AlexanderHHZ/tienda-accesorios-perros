'use client';

import { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorNotice } from '@/components/ui/feedback';
import { empaquetadosApi } from '@/services/empaquetados-api';
import { errorMessage } from '@/services/http-client';
import { formatId, formatNumber } from '@/lib/format';
import type { Empaquetado } from '@/types/empaquetado';

type Props = {
  item: Empaquetado;
  busy: boolean;
  onBusy: (busy: boolean) => void;
  onDeleted: () => void;
  onClose: () => void;
};

export function DeleteConfirmation({ item, busy, onBusy, onDeleted, onClose }: Props) {
  const [error, setError] = useState('');
  const submitting = useRef(false);
  async function remove() {
    if (submitting.current) return;
    submitting.current = true;
    onBusy(true);
    setError('');
    try {
      await empaquetadosApi.remove(item.id, item.updatedAt);
      onDeleted();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      submitting.current = false;
      onBusy(false);
    }
  }
  return (
    <>
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
        <Trash2 className="size-5 text-red-700" aria-hidden="true" />
        <div>
          <p className="text-sm font-bold">{formatId(item.id)}</p>
          <p className="mt-1 text-xs text-muted">
            {formatNumber(item.peso)} kg · {item.tipoEmpacado === 'caja' ? 'Caja' : 'Bolsa'}
          </p>
        </div>
      </div>
      {error ? <ErrorNotice message={error} /> : null}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" disabled={busy} onClick={onClose} data-initial-focus>
          Cancelar
        </Button>
        <Button
          variant="danger"
          loading={busy}
          onClick={() => {
            void remove();
          }}
        >
          {busy ? 'Eliminando…' : 'Eliminar'}
        </Button>
      </div>
    </>
  );
}
