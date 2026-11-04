import { z } from 'zod';
import { identifierSchema, reasonSchema, statusSchema } from './common.js';

export const createReturnSchema = z.strictObject({
  saleId: identifierSchema.describe('VENTAS.id; para la demostración: 1001.'),
  productId: identifierSchema.describe('PRODUCTOS.id; para la demostración: 102.'),
  quantity: z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
    .describe('Unidades enteras solicitadas; se descuentan las ya reservadas o devueltas.'),
  reason: reasonSchema,
}).meta({ examples: [{ saleId: 1001, productId: 102, quantity: 1, reason: 'El envase presenta una fuga.' }] });

export const returnStatusSchema = z.strictObject({ status: statusSchema })
  .meta({ examples: [{ status: 'APPROVED' }] });

export const returnResponseSchema = z.object({
  id: identifierSchema,
  saleId: identifierSchema,
  productId: identifierSchema,
  quantity: z.number().int().positive(),
  reason: z.string(),
  date: z.iso.datetime(),
  status: statusSchema,
}).describe('Devolución de venta; los nombres JSON se mapean a las columnas existentes.');
