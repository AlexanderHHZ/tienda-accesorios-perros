import { z } from 'zod';
import { PROCESS_STATUSES } from '../../domain/process-status.js';

z.config(z.locales.es());

export const identifierSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const statusSchema = z.enum(PROCESS_STATUSES);
export const reasonSchema = z.string().trim().min(1).max(2000);
export const resolutionSchema = z.string().trim().min(1).max(4000);
export const idParamsSchema = z.strictObject({
  id: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER)
    .describe('Identificador entero positivo del recurso.'),
});

export const errorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
});

export const errorResponses = {
  400: errorSchema.describe('Entrada inválida o resolución requerida.'),
  404: errorSchema.describe('Venta, producto o recurso inexistente.'),
  409: errorSchema.describe('Conflicto de cantidad, garantía activa o transición de estado.'),
  413: errorSchema.describe('El cuerpo supera BODY_LIMIT.'),
  415: errorSchema.describe('Formato no admitido; enviar application/json.'),
  500: errorSchema.describe('Error interno sin detalles sensibles.'),
};
