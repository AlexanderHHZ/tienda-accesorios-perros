import { request } from './client';
import {
  returnSchema,
  warrantySchema,
  type ChangeReturnStatus,
  type ChangeWarrantyStatus,
  type CreateReturn,
  type CreateWarranty,
  type RequestKind,
  type RequestRecord,
} from './contracts';

export const returnsApi = {
  list: (signal: AbortSignal) => request('/returns', returnSchema.array(), { signal }),
  get: (id: number, signal: AbortSignal) => request(`/returns/${id}`, returnSchema, { signal }),
  create: (body: CreateReturn) => request('/returns', returnSchema, { method: 'POST', body }),
  changeStatus: (id: number, body: ChangeReturnStatus) =>
    request(`/returns/${id}/status`, returnSchema, { method: 'PATCH', body }),
};

export const warrantiesApi = {
  list: (signal: AbortSignal) => request('/warranties', warrantySchema.array(), { signal }),
  get: (id: number, signal: AbortSignal) =>
    request(`/warranties/${id}`, warrantySchema, { signal }),
  create: (body: CreateWarranty) =>
    request('/warranties', warrantySchema, { method: 'POST', body }),
  changeStatus: (id: number, body: ChangeWarrantyStatus) =>
    request(`/warranties/${id}/status`, warrantySchema, { method: 'PATCH', body }),
};

export function listRequests(kind: RequestKind, signal: AbortSignal): Promise<RequestRecord[]> {
  return kind === 'returns' ? returnsApi.list(signal) : warrantiesApi.list(signal);
}

export function getRequest(
  kind: RequestKind,
  id: number,
  signal: AbortSignal,
): Promise<RequestRecord> {
  return kind === 'returns' ? returnsApi.get(id, signal) : warrantiesApi.get(id, signal);
}
