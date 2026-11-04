import { z } from 'zod';

export const statusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED']);
const identifier = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const commonFields = {
  id: identifier,
  saleId: identifier,
  productId: identifier,
  reason: z.string(),
  status: statusSchema,
};

// Contratos HTTP locales: el frontend no importa entidades internas del backend.
export const returnSchema = z.object({
  ...commonFields,
  quantity: identifier,
  date: z.iso.datetime(),
});

export const warrantySchema = z.object({
  ...commonFields,
  requestDate: z.iso.datetime(),
  resolution: z.string(),
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
});

export type RequestStatus = z.infer<typeof statusSchema>;
export type ReturnRecord = z.infer<typeof returnSchema>;
export type WarrantyRecord = z.infer<typeof warrantySchema>;
export type RequestRecord = ReturnRecord | WarrantyRecord;
export type RequestKind = 'returns' | 'warranties';
export type CreateReturn = Pick<ReturnRecord, 'saleId' | 'productId' | 'quantity' | 'reason'>;
export type CreateWarranty = Pick<WarrantyRecord, 'saleId' | 'productId' | 'reason'>;
export type ChangeReturnStatus = { status: RequestStatus };
export type ChangeWarrantyStatus = { status: RequestStatus; resolution?: string };
