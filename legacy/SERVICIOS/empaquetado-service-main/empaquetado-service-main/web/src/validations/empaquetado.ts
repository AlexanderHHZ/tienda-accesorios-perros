import { z } from 'zod';

const positive = z
  .number({ error: 'Introduce un número válido.' })
  .gt(0, 'Introduce un valor mayor que 0.')
  .max(1_000_000_000, 'El valor máximo es 1 000 000 000.');
export const empaquetadoInputSchema = z.object({
  peso: positive,
  tamano: z.enum(['chico', 'mediano', 'grande'], { error: 'Selecciona un tamaño.' }),
  medidas: z.object({ largo: positive, ancho: positive, alto: positive }),
  tipoEmpacado: z.enum(['caja', 'bolsa'], { error: 'Selecciona un tipo de empacado.' }),
});
export const empaquetadoSchema = empaquetadoInputSchema.extend({
  id: z.number().int().positive(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export const itemResponseSchema = z.object({ success: z.literal(true), data: empaquetadoSchema });
export const listResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(empaquetadoSchema),
  meta: z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
    summary: z.object({
      cajas: z.number().int().nonnegative(),
      bolsas: z.number().int().nonnegative(),
      pesoTotal: z.number().nonnegative(),
    }),
  }),
});
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
});
