import type { EmpaquetadoInput, Filters } from '@/types/empaquetado';
import { itemResponseSchema, listResponseSchema } from '@/validations/empaquetado';
import { parseResponse, request } from './http-client';

export function listPath(filters: Filters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value !== '') params.set(key, String(value));
  return `/empaquetados?${params.toString()}`;
}

export const empaquetadosApi = {
  async list(path: string) {
    return parseResponse(listResponseSchema, await request(path));
  },
  async get(id: number) {
    return parseResponse(itemResponseSchema, await request(`/empaquetados/${id}`)).data;
  },
  async create(input: EmpaquetadoInput) {
    return parseResponse(
      itemResponseSchema,
      await request('/empaquetados', { method: 'POST', body: JSON.stringify(input) }),
    ).data;
  },
  async update(id: number, input: EmpaquetadoInput, version: string) {
    return parseResponse(
      itemResponseSchema,
      await request(`/empaquetados/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
        headers: { 'X-Expected-Updated-At': version },
      }),
    ).data;
  },
  async remove(id: number, version: string) {
    await request(`/empaquetados/${id}`, {
      method: 'DELETE',
      headers: { 'X-Expected-Updated-At': version },
    });
  },
};
