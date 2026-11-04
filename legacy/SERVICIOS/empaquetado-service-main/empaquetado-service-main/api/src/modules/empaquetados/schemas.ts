import { z } from 'zod';

// Límite técnico para evitar desbordamientos; no clasifica tamaños ni limita un transportista.
const positive = z
  .number({ error: 'Introduce un número válido.' })
  .gt(0, 'Debe ser mayor que 0.')
  .max(1_000_000_000, 'El valor máximo es 1 000 000 000.');
export const tamanoSchema = z.enum(['chico', 'mediano', 'grande'], {
  error: 'Selecciona chico, mediano o grande.',
});
export const tipoSchema = z.enum(['caja', 'bolsa'], { error: 'Selecciona caja o bolsa.' });
export const medidasSchema = z
  .strictObject({
    largo: positive.describe('Largo en centímetros.'),
    ancho: positive.describe('Ancho en centímetros.'),
    alto: positive.describe('Alto en centímetros.'),
  })
  .meta({ id: 'Medidas', example: { largo: 40, ancho: 30, alto: 20 } });

export const createSchema = z
  .strictObject({
    peso: positive.describe('Peso en kilogramos.'),
    tamano: tamanoSchema,
    medidas: medidasSchema,
    tipoEmpacado: tipoSchema,
  })
  .meta({
    id: 'CrearEmpaquetado',
    example: {
      peso: 4.5,
      tamano: 'mediano',
      medidas: { largo: 40, ancho: 30, alto: 20 },
      tipoEmpacado: 'caja',
    },
  });

export const patchSchema = z
  .strictObject({
    peso: positive.optional(),
    tamano: tamanoSchema.optional(),
    medidas: medidasSchema
      .partial()
      .refine((value) => Object.keys(value).length > 0, 'Incluye al menos una medida.')
      .meta({ minProperties: 1 })
      .optional(),
    tipoEmpacado: tipoSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Incluye al menos un campo para actualizar.')
  .meta({
    id: 'ActualizarEmpaquetado',
    minProperties: 1,
    example: { peso: 5, medidas: { alto: 22 } },
  });

const positiveIntegerString = z.string().regex(/^[1-9]\d*$/, 'Debe ser un entero positivo.');
export const idSchema = z.strictObject({
  id: positiveIntegerString.pipe(z.coerce.number<string>().int().max(Number.MAX_SAFE_INTEGER)),
});
export const versionHeadersSchema = z.object({
  'x-expected-updated-at': z.iso
    .datetime()
    .optional()
    .describe('updatedAt leído previamente. Si cambió, se responde 409.'),
});

export const querySchema = z.strictObject({
  q: z
    .string()
    .trim()
    .max(80)
    .default('')
    .describe('ID (1 o EMP-0001), tamaño o tipo. Coincidencia parcial para texto.'),
  tamano: tamanoSchema.optional(),
  tipoEmpacado: tipoSchema.optional(),
  page: z.coerce.number<string>().int().min(1).max(1_000_000).default(1),
  limit: z.coerce.number<string>().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'peso', 'id']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const empaquetadoSchema = createSchema
  .extend({
    id: z.number().int().positive(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({
    id: 'Empaquetado',
    example: {
      id: 1,
      peso: 4.5,
      tamano: 'mediano',
      medidas: { largo: 40, ancho: 30, alto: 20 },
      tipoEmpacado: 'caja',
      createdAt: '2026-10-06T00:00:00.000Z',
      updatedAt: '2026-10-06T00:00:00.000Z',
    },
  });

export const itemResponseSchema = z.object({ success: z.literal(true), data: empaquetadoSchema });
export const summarySchema = z.object({
  cajas: z.number().int(),
  bolsas: z.number().int(),
  pesoTotal: z.number(),
});
export const listResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(empaquetadoSchema),
  meta: z.object({
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int(),
    summary: summarySchema,
  }),
});

export const errorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
      requestId: z.string(),
      details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
    }),
  })
  .meta({
    id: 'Error',
    example: {
      success: false,
      error: { code: 'NOT_FOUND', message: 'No se encontró el empaquetado.', requestId: 'req-1' },
    },
  });

export type CreateInput = z.infer<typeof createSchema>;
export type PatchInput = z.infer<typeof patchSchema>;
export type ListQuery = z.infer<typeof querySchema>;
export type Empaquetado = z.infer<typeof empaquetadoSchema>;
