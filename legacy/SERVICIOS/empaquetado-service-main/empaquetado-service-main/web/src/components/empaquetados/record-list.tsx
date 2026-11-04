import { Box, Eye, Pencil, ShoppingBag, Trash2 } from 'lucide-react';
import type { Empaquetado } from '@/types/empaquetado';
import { formatDate, formatId, formatNumber, sizeLabels } from '@/lib/format';

type Props = {
  items: Empaquetado[];
  onView: (item: Empaquetado) => void;
  onEdit: (item: Empaquetado) => void;
  onDelete: (item: Empaquetado) => void;
};
const badgeColors = {
  chico: 'bg-[#edf3e9] text-[#506444]',
  mediano: 'bg-[#fff1df] text-[#86622c]',
  grande: 'bg-[#eeedf6] text-[#655688]',
};

function TypeBadge({ item }: { item: Empaquetado }) {
  const Icon = item.tipoEmpacado === 'caja' ? Box : ShoppingBag;
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
      <Icon className="size-4" strokeWidth={1.6} aria-hidden="true" />
      {item.tipoEmpacado === 'caja' ? 'Caja' : 'Bolsa'}
    </span>
  );
}

function Actions({ item, onView, onEdit, onDelete }: Omit<Props, 'items'> & { item: Empaquetado }) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <button
        onClick={() => onView(item)}
        aria-label={`Ver ${formatId(item.id)}`}
        title="Ver detalles"
        className="flex size-10 items-center justify-center rounded-lg text-muted hover:bg-stone-100 hover:text-ink"
      >
        <Eye className="size-4" />
      </button>
      <button
        onClick={() => onEdit(item)}
        aria-label={`Editar ${formatId(item.id)}`}
        title="Editar"
        className="flex size-10 items-center justify-center rounded-lg text-muted hover:bg-accent-soft hover:text-accent"
      >
        <Pencil className="size-4" />
      </button>
      <button
        onClick={() => onDelete(item)}
        aria-label={`Eliminar ${formatId(item.id)}`}
        title="Eliminar"
        className="flex size-10 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

export function RecordList({ items, ...actions }: Props) {
  return (
    <>
      <div className="hidden xl:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Empaquetados registrados: peso en kilogramos y dimensiones en centímetros.
          </caption>
          <thead className="border-b border-line bg-canvas/60 text-[10px] font-semibold uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="py-3.5 pl-5 pr-3">
                Empaquetado
              </th>
              <th scope="col" className="px-3 py-3.5">
                Peso
              </th>
              <th scope="col" className="px-3 py-3.5">
                Medidas · cm
              </th>
              <th scope="col" className="px-3 py-3.5">
                Tamaño
              </th>
              <th scope="col" className="px-3 py-3.5">
                Tipo
              </th>
              <th scope="col" className="py-3.5 pl-3 pr-5 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((item) => (
              <tr key={item.id} className="group hover:bg-canvas/50">
                <td className="py-4 pl-5 pr-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas">
                      <Box className="size-4 text-muted" strokeWidth={1.4} aria-hidden="true" />
                    </span>
                    <div>
                      <button
                        className="font-bold text-ink hover:text-accent"
                        onClick={() => actions.onView(item)}
                      >
                        {formatId(item.id)}
                      </button>
                      <p className="mt-1 text-[10px] text-muted">{formatDate(item.createdAt)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 text-xs tabular-nums">
                  <span className="font-semibold">{formatNumber(item.peso)}</span>
                  <span className="ml-1 text-muted">kg</span>
                </td>
                <td className="px-3 py-4 text-xs tabular-nums text-muted">
                  {formatNumber(item.medidas.largo)} × {formatNumber(item.medidas.ancho)} ×{' '}
                  {formatNumber(item.medidas.alto)}
                </td>
                <td className="px-3 py-4">
                  <span
                    className={`inline-block rounded-md px-2.5 py-1.5 text-[10px] font-bold ${badgeColors[item.tamano]}`}
                  >
                    {sizeLabels[item.tamano]}
                  </span>
                </td>
                <td className="px-3 py-4">
                  <TypeBadge item={item} />
                </td>
                <td className="py-4 pl-2 pr-3">
                  <Actions item={item} {...actions} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:hidden">
        {items.map((item) => (
          <article
            key={item.id}
            aria-label={formatId(item.id)}
            className="min-w-0 rounded-xl border border-line p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => actions.onView(item)}
                className="text-sm font-bold hover:text-accent"
              >
                {formatId(item.id)}
              </button>
              <span
                className={`rounded-md px-2.5 py-1.5 text-[10px] font-bold ${badgeColors[item.tamano]}`}
              >
                {sizeLabels[item.tamano]}
              </span>
            </div>
            <div className="my-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted">PESO</p>
                <p className="mt-1 break-all text-xl font-semibold tabular-nums">
                  {formatNumber(item.peso)}{' '}
                  <span className="text-xs font-normal text-muted">kg</span>
                </p>
              </div>
              <TypeBadge item={item} />
            </div>
            <p className="break-words text-xs text-muted">
              {formatNumber(item.medidas.largo)} × {formatNumber(item.medidas.ancho)} ×{' '}
              {formatNumber(item.medidas.alto)} cm
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-2">
              <span className="text-[10px] text-muted">{formatDate(item.createdAt)}</span>
              <Actions item={item} {...actions} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
