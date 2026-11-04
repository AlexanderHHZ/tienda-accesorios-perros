import { AppError } from '../../errors/app-error.js';
import type { EmpaquetadosRepository } from './repository.js';
import type { PatchInput } from './schemas.js';

export class EmpaquetadosService {
  constructor(private readonly repository: EmpaquetadosRepository) {}

  get(id: number) {
    const item = this.repository.findById(id);
    if (!item) throw new AppError(404, 'NOT_FOUND', 'No se encontró el empaquetado.');
    return item;
  }

  private checkVersion(current: string, expected?: string) {
    if (expected && current !== expected) this.conflict();
  }

  private conflict(): never {
    throw new AppError(
      409,
      'EDIT_CONFLICT',
      'El registro cambió. Actualiza la lista y vuelve a abrirlo para continuar.',
    );
  }

  update(id: number, patch: PatchInput, expected?: string) {
    const current = this.get(id);
    this.checkVersion(current.updatedAt, expected);
    const updated = this.repository.update(current, patch);
    if (!updated) this.conflict();
    return updated;
  }

  delete(id: number, expected?: string) {
    const current = this.get(id);
    this.checkVersion(current.updatedAt, expected);
    if (!this.repository.delete(current)) this.conflict();
  }
}
