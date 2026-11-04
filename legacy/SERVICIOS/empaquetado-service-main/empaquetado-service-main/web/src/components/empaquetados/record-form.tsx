'use client';

import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Box, Check, Ruler, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorNotice } from '@/components/ui/feedback';
import type { Empaquetado, EmpaquetadoInput, FieldErrors } from '@/types/empaquetado';
import { empaquetadoInputSchema } from '@/validations/empaquetado';
import { ApiError, errorMessage } from '@/services/http-client';
import { NumberField } from './number-field';
import { sizeLabels } from '@/lib/format';

type Props = {
  item?: Empaquetado;
  busy: boolean;
  onBusy: (busy: boolean) => void;
  onSave: (input: EmpaquetadoInput) => Promise<void>;
  onClose: () => void;
};

function assignError(
  errors: FieldErrors,
  key: string | number | symbol | undefined,
  message: string,
) {
  if (
    key === 'peso' ||
    key === 'tamano' ||
    key === 'largo' ||
    key === 'ancho' ||
    key === 'alto' ||
    key === 'tipoEmpacado'
  )
    errors[key] = message;
}

export function RecordForm({ item, busy, onBusy, onSave, onClose }: Props) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState('');
  const submitting = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = empaquetadoInputSchema.safeParse({
      peso: Number(data.get('peso')),
      tamano: data.get('tamano'),
      tipoEmpacado: data.get('tipoEmpacado'),
      medidas: {
        largo: Number(data.get('largo')),
        ancho: Number(data.get('ancho')),
        alto: Number(data.get('alto')),
      },
    });
    setFailure('');
    const nextErrors: FieldErrors = {};
    if (!result.success) {
      for (const issue of result.error.issues)
        assignError(nextErrors, issue.path.at(-1), issue.message);
      setErrors(nextErrors);
      requestAnimationFrame(() =>
        form.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    setErrors({});
    submitting.current = true;
    onBusy(true);
    try {
      await onSave(result.data);
    } catch (error) {
      setFailure(errorMessage(error));
      if (error instanceof ApiError) {
        for (const detail of error.details ?? [])
          assignError(nextErrors, detail.path.split('.').at(-1), detail.message);
        setErrors(nextErrors);
      }
    } finally {
      submitting.current = false;
      onBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      onChange={() => {
        if (Object.keys(errors).length) setErrors({});
      }}
    >
      <fieldset disabled={busy} className="space-y-6">
        <NumberField name="peso" label="Peso" unit="kg" value={item?.peso} error={errors.peso} />
        <fieldset>
          <legend className="mb-2 text-xs font-semibold">Tamaño</legend>
          <div className="grid grid-cols-3 gap-2">
            {(['chico', 'mediano', 'grande'] as const).map((size) => (
              <label key={size} className="cursor-pointer">
                <input
                  type="radio"
                  name="tamano"
                  value={size}
                  defaultChecked={size === (item?.tamano ?? 'mediano')}
                  className="peer sr-only"
                />
                <span className="flex min-h-11 items-center justify-center rounded-xl border border-line text-xs font-semibold text-muted peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
                  {sizeLabels[size]}
                </span>
              </label>
            ))}
          </div>
          {errors.tamano ? <p className="mt-2 text-xs text-red-700">{errors.tamano}</p> : null}
        </fieldset>
        <fieldset>
          <legend className="mb-3 flex items-center gap-2 text-xs font-semibold">
            <Ruler className="size-4 text-muted" aria-hidden="true" />
            Medidas <span className="font-normal text-muted">en centímetros</span>
          </legend>
          <div className="grid grid-cols-3 gap-3">
            {(['largo', 'ancho', 'alto'] as const).map((dimension) => (
              <NumberField
                key={dimension}
                name={dimension}
                label={dimension.charAt(0).toUpperCase() + dimension.slice(1)}
                unit="cm"
                value={item?.medidas[dimension]}
                error={errors[dimension]}
              />
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-5 text-muted">
            Usa las dimensiones exteriores del empaque ya cerrado.
          </p>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-xs font-semibold">Tipo de empacado</legend>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { value: 'caja', label: 'Caja', icon: Box },
                { value: 'bolsa', label: 'Bolsa', icon: ShoppingBag },
              ] as const
            ).map(({ value, label, icon: Icon }) => (
              <label key={value} className="cursor-pointer">
                <input
                  type="radio"
                  name="tipoEmpacado"
                  value={value}
                  defaultChecked={value === (item?.tipoEmpacado ?? 'caja')}
                  className="peer sr-only"
                />
                <span className="flex min-h-16 items-center justify-center gap-3 rounded-xl border border-line text-sm font-semibold text-muted peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
                  <Icon className="size-5" strokeWidth={1.6} aria-hidden="true" />
                  {label}
                </span>
              </label>
            ))}
          </div>
          {errors.tipoEmpacado ? (
            <p className="mt-2 text-xs text-red-700">{errors.tipoEmpacado}</p>
          ) : null}
        </fieldset>
      </fieldset>
      {failure ? (
        <div className="mt-5">
          <ErrorNotice message={failure} />
        </div>
      ) : null}
      <div className="mt-7 flex items-center justify-end gap-3 border-t border-line pt-5">
        <Button variant="secondary" disabled={busy} onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" loading={busy}>
          {busy ? (
            'Guardando…'
          ) : (
            <>
              <Check className="size-4" aria-hidden="true" />
              Guardar
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
