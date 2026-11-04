type Props = { name: string; label: string; unit: string; value?: number; error?: string };

export function NumberField({ name, label, unit, value, error }: Props) {
  return (
    <div className="min-w-0">
      <label htmlFor={`field-${name}`} className="mb-2 block text-xs font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={`field-${name}`}
          name={name}
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          max="1000000000"
          required
          data-initial-focus={name === 'peso' || undefined}
          defaultValue={value ?? ''}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `error-${name}` : undefined}
          className={`min-h-12 w-full min-w-0 rounded-xl border bg-white py-3 pl-3.5 pr-11 text-sm tabular-nums ${error ? 'border-red-500' : 'border-line'}`}
        />
        <span className="pointer-events-none absolute right-3 top-4 text-xs text-muted">
          {unit}
        </span>
      </div>
      {error ? (
        <p id={`error-${name}`} className="mt-1.5 text-xs leading-5 text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
