import { z } from 'zod';
import { identifierSchema, reasonSchema, resolutionSchema, statusSchema } from './common.js';

export const createWarrantySchema = z.strictObject({
  saleId: identifierSchema,
  productId: identifierSchema,
  reason: reasonSchema,
}).meta({ examples: [{ saleId: 1001, productId: 101, reason: 'La pintura no tiene la consistencia indicada.' }] });

export const warrantyStatusSchema = z.strictObject({
  status: statusSchema,
  resolution: resolutionSchema.optional().describe(
    'Puede registrarse al aprobar o rechazar. Para completar debe existir una resolución previa o enviarse aquí.',
  ),
}).meta({ examples: [{ status: 'APPROVED', resolution: 'Se autoriza reemplazo del producto.' }] });

export const warrantyResponseSchema = z.object({
  id: identifierSchema,
  saleId: identifierSchema,
  productId: identifierSchema,
  requestDate: z.iso.datetime(),
  reason: z.string(),
  status: statusSchema,
  resolution: z.string().describe('Cadena vacía mientras no se haya registrado una resolución.'),
}).describe('Garantía sin cantidad: el modelo solo identifica la pareja venta y producto.');
