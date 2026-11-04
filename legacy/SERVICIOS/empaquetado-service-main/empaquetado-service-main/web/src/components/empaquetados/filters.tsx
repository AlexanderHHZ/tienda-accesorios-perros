import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { Filters as FilterValues } from '@/types/empaquetado';

type Props = { filters: FilterValues; onChange: (values: Partial<FilterValues>) => void };
const selectClass =
  'min-h-11 min-w-0 rounded-xl border border-line bg-white px-3 text-xs font-medium text-ink';

export function Filters({ filters, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:px-5 2xl:flex-row">
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted"
          aria-hidden="true"
        />
        <label htmlFor="search" className="sr-only">
          Buscar empaquetados
        </label>
        <input
          id="search"
          type="search"
          maxLength={80}
          value={filters.q}
          onChange={(event) => onChange({ q: event.target.value })}
          placeholder="Buscar por ID, tamaño o tipo…"
          className="min-h-11 w-full rounded-xl border border-line bg-canvas/50 py-2.5 pl-10 pr-11 text-sm placeholder:text-muted [&::-webkit-search-cancel-button]:appearance-none"
        />
        {filters.q ? (
          <button
            onClick={() => onChange({ q: '' })}
            aria-label="Limpiar búsqueda"
            className="absolute right-0.5 top-0.5 flex size-10 items-center justify-center rounded-lg text-muted hover:text-ink"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <SlidersHorizontal
          className="mr-1 hidden size-4 self-center text-muted sm:block"
          aria-hidden="true"
        />
        <label className="sr-only" htmlFor="filter-size">
          Filtrar por tamaño
        </label>
        <select
          id="filter-size"
          value={filters.tamano}
          onChange={(event) => {
            const value = event.target.value;
            if (value === '' || value === 'chico' || value === 'mediano' || value === 'grande')
              onChange({ tamano: value });
          }}
          className={selectClass}
        >
          <option value="">Todos los tamaños</option>
          <option value="chico">Chico</option>
          <option value="mediano">Mediano</option>
          <option value="grande">Grande</option>
        </select>
        <label className="sr-only" htmlFor="filter-type">
          Filtrar por tipo
        </label>
        <select
          id="filter-type"
          value={filters.tipoEmpacado}
          onChange={(event) => {
            const value = event.target.value;
            if (value === '' || value === 'caja' || value === 'bolsa')
              onChange({ tipoEmpacado: value });
          }}
          className={selectClass}
        >
          <option value="">Todos los tipos</option>
          <option value="caja">Caja</option>
          <option value="bolsa">Bolsa</option>
        </select>
        <label className="sr-only" htmlFor="filter-sort">
          Ordenar empaquetados
        </label>
        <select
          id="filter-sort"
          value={`${filters.sortBy}-${filters.order}`}
          onChange={(event) => {
            const value = event.target.value;
            onChange(
              value === 'peso-asc'
                ? { sortBy: 'peso', order: 'asc' }
                : value === 'peso-desc'
                  ? { sortBy: 'peso', order: 'desc' }
                  : value === 'createdAt-asc'
                    ? { sortBy: 'createdAt', order: 'asc' }
                    : { sortBy: 'createdAt', order: 'desc' },
            );
          }}
          className={`${selectClass} col-span-2`}
        >
          <option value="createdAt-desc">Más recientes</option>
          <option value="createdAt-asc">Más antiguos</option>
          <option value="peso-asc">Menor peso</option>
          <option value="peso-desc">Mayor peso</option>
        </select>
      </div>
    </div>
  );
}
