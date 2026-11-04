import type { z } from 'zod';
import type {
  empaquetadoInputSchema,
  empaquetadoSchema,
  listResponseSchema,
} from '@/validations/empaquetado';

export type Empaquetado = z.infer<typeof empaquetadoSchema>;
export type EmpaquetadoInput = z.infer<typeof empaquetadoInputSchema>;
export type EmpaquetadosPage = z.infer<typeof listResponseSchema>;
export type Filters = {
  q: string;
  tamano: '' | Empaquetado['tamano'];
  tipoEmpacado: '' | Empaquetado['tipoEmpacado'];
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'peso' | 'id';
  order: 'asc' | 'desc';
};
export type ActivePanel =
  | { kind: 'create' }
  | { kind: 'edit'; item: Empaquetado }
  | { kind: 'view'; id: number }
  | { kind: 'delete'; item: Empaquetado }
  | { kind: 'guide' };
export type FieldErrors = Partial<
  Record<'peso' | 'tamano' | 'largo' | 'ancho' | 'alto' | 'tipoEmpacado', string>
>;
