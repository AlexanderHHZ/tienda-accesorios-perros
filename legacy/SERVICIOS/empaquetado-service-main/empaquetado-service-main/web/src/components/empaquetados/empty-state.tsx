import { PackageOpen, Plus, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyState({
  filtered,
  onCreate,
  onReset,
}: {
  filtered: boolean;
  onCreate: () => void;
  onReset: () => void;
}) {
  const Icon = filtered ? SearchX : PackageOpen;
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="mb-5 flex size-16 items-center justify-center rounded-2xl border border-[#edd4c5] bg-accent-soft">
        <Icon className="size-8 text-accent" strokeWidth={1.25} aria-hidden="true" />
      </span>
      <h3 className="text-lg font-semibold tracking-tight">
        {filtered ? 'No encontramos coincidencias' : 'El orden empieza con el primer paquete'}
      </h3>
      <p className="mb-5 mt-2 max-w-sm text-sm leading-6 text-muted">
        {filtered
          ? 'Prueba con otro ID, tamaño o tipo de empacado.'
          : 'Registra su peso, medidas y tipo. Aquí tendrás todos tus empaquetados a la vista.'}
      </p>
      <Button variant={filtered ? 'secondary' : 'primary'} onClick={filtered ? onReset : onCreate}>
        {filtered ? (
          'Limpiar filtros'
        ) : (
          <>
            <Plus className="size-4" aria-hidden="true" />
            Crear primer empaquetado
          </>
        )}
      </Button>
    </div>
  );
}
