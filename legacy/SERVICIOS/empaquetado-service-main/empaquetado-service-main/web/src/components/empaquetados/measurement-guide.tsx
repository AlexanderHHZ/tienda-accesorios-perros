import { Box, Ruler, Scale } from 'lucide-react';

export function MeasurementGuide() {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <Scale className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-bold">Peso total, en kilogramos</h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            Pesa el paquete completo, incluido el material de empaque. Para registrar 800 gramos,
            introduce 0.8 kg.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <Ruler className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-bold">Tres medidas, en centímetros</h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            Registra largo, ancho y alto por separado. Mide las dimensiones exteriores máximas del
            empaque ya cerrado. En una bolsa, incluye el grosor del contenido.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <Box className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-bold">Una clasificación que tú eliges</h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            Chico, mediano y grande son categorías de organización. No hay rangos automáticos ni
            tarifas asociadas. Caja y bolsa describen el material que contiene el paquete.
          </p>
        </div>
      </div>
      <p className="rounded-xl bg-canvas p-4 text-xs leading-5 text-muted">
        Todos los valores deben ser mayores que cero. Los campos numéricos admiten decimales.
      </p>
    </div>
  );
}
