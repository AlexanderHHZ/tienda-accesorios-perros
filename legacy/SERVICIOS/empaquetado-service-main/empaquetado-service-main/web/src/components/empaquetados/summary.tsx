import { Box, Layers3, Scale, ShoppingBag } from 'lucide-react';
import type { EmpaquetadosPage } from '@/types/empaquetado';
import { formatNumber } from '@/lib/format';

export function Summary({ meta }: { meta?: EmpaquetadosPage['meta'] }) {
  const metrics = [
    {
      label: 'Empaquetados',
      value: meta?.total,
      icon: Layers3,
      unit: 'registros',
      color: 'bg-accent-soft text-accent',
    },
    {
      label: 'En caja',
      value: meta?.summary.cajas,
      icon: Box,
      unit: 'unidades',
      color: 'bg-[#edf2e7] text-[#566745]',
    },
    {
      label: 'En bolsa',
      value: meta?.summary.bolsas,
      icon: ShoppingBag,
      unit: 'unidades',
      color: 'bg-[#f3eee6] text-[#84623b]',
    },
    {
      label: 'Peso acumulado',
      value: meta?.summary.pesoTotal,
      icon: Scale,
      unit: 'kg',
      color: 'bg-[#edf0f5] text-[#51647f]',
    },
  ];
  return (
    <section
      aria-label="Resumen de resultados"
      className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4"
    >
      {metrics.map(({ label, value, icon: Icon, unit, color }) => (
        <div key={label} className="min-w-0 rounded-2xl border border-line bg-white p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted">{label}</p>
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${color}`}
            >
              <Icon className="size-4.5" strokeWidth={1.7} aria-hidden="true" />
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="break-all text-[28px] font-semibold leading-tight tracking-tight tabular-nums sm:text-[32px]">
              {value === undefined ? '—' : formatNumber(value)}
            </p>
            <span className="text-[11px] text-muted">{unit}</span>
          </div>
        </div>
      ))}
    </section>
  );
}
