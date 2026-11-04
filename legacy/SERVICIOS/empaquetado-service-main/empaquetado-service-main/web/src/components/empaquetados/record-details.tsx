'use client';

import useSWR from 'swr';
import { Box, Pencil, Scale, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorNotice, LoadingState } from '@/components/ui/feedback';
import { empaquetadosApi } from '@/services/empaquetados-api';
import { errorMessage } from '@/services/http-client';
import { formatDateTime, formatId, formatNumber, sizeLabels } from '@/lib/format';
import type { Empaquetado } from '@/types/empaquetado';

export function RecordDetails({ id, onEdit }: { id: number; onEdit: (item: Empaquetado) => void }) {
  const {
    data: item,
    error,
    isLoading,
    mutate,
  } = useSWR(['empaquetado', id], () => empaquetadosApi.get(id), {
    revalidateOnMount: true,
    errorRetryCount: 1,
  });
  if (error)
    return (
      <ErrorNotice
        message={errorMessage(error)}
        retry={() => {
          void mutate().catch(() => undefined);
        }}
      />
    );
  if (isLoading || !item) return <LoadingState />;
  const Icon = item.tipoEmpacado === 'caja' ? Box : ShoppingBag;
  return (
    <div>
      <div className="mb-6 flex items-center gap-4 rounded-2xl bg-canvas p-5">
        <span className="flex size-14 items-center justify-center rounded-xl border border-line bg-white">
          <Icon className="size-7 text-accent" strokeWidth={1.4} aria-hidden="true" />
        </span>
        <div>
          <p className="text-lg font-bold">{formatId(item.id)}</p>
          <p className="mt-1 text-xs text-muted">
            {item.tipoEmpacado === 'caja' ? 'Caja' : 'Bolsa'} · {sizeLabels[item.tamano]}
          </p>
        </div>
        <div className="ml-auto text-right">
          <Scale className="ml-auto size-4 text-muted" aria-hidden="true" />
          <p className="mt-2 text-sm font-bold">{formatNumber(item.peso)} kg</p>
        </div>
      </div>
      <p className="mb-3 text-xs font-semibold text-muted">DIMENSIONES EXTERIORES</p>
      <dl className="grid grid-cols-3 gap-3">
        {(['largo', 'ancho', 'alto'] as const).map((dimension) => (
          <div key={dimension} className="min-w-0 rounded-xl border border-line p-3 text-center">
            <dt className="text-xs capitalize text-muted">{dimension}</dt>
            <dd className="mt-2 break-all text-lg font-semibold">
              {formatNumber(item.medidas[dimension])}
              <span className="ml-1 text-[10px] font-normal text-muted">cm</span>
            </dd>
          </div>
        ))}
      </dl>
      <dl className="mt-6 space-y-3 border-t border-line pt-5 text-xs">
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-muted">Creado</dt>
          <dd>{formatDateTime(item.createdAt)}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-muted">Última actualización</dt>
          <dd>{formatDateTime(item.updatedAt)}</dd>
        </div>
      </dl>
      <Button onClick={() => onEdit(item)} className="mt-6 w-full">
        <Pencil className="size-4" aria-hidden="true" />
        Editar empaquetado
      </Button>
    </div>
  );
}
