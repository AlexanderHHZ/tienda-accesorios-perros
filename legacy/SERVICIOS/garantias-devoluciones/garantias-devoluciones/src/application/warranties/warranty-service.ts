import { DomainError } from '../../domain/errors.js';
import type { ProcessStatus } from '../../domain/process-status.js';
import type { UnitOfWork } from '../../domain/unit-of-work.js';
import { assertIdentifier, normalizeReason } from '../../domain/validation.js';
import {
  assertNoActiveWarranty,
  changeWarrantyStatus,
  type Warranty,
} from '../../domain/warranties/warranty.js';
import { getPurchasedQuantity } from '../purchase-context.js';

export interface CreateWarrantyInput {
  readonly saleId: number;
  readonly productId: number;
  readonly reason: string;
}

/** Casos de uso de garantías; no conoce HTTP ni el almacenamiento concreto. */
export class WarrantyService {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /**
   * Verifica que el producto pertenezca a la venta y evita garantías
   * activas duplicadas dentro de la misma unidad de trabajo.
   */
  create(input: CreateWarrantyInput): Promise<Warranty> {
    return this.unitOfWork.run(async (repositories) => {
      const reason = normalizeReason(input.reason);

      await getPurchasedQuantity(
        repositories,
        input.saleId,
        input.productId,
      );

      const previous =
        await repositories.warranties.findBySaleAndProduct(
          input.saleId,
          input.productId,
        );

      assertNoActiveWarranty(previous);

      return repositories.warranties.create({
        id_venta: input.saleId,
        id_producto: input.productId,
        motivo: reason,
        fecha_solicitud: this.now().toISOString(),
        estado: 'PENDING',
        resolucion: '',
      });
    });
  }

  list(): Promise<readonly Warranty[]> {
    return this.unitOfWork.run((repositories) =>
      repositories.warranties.findAll(),
    );
  }

  getById(id: number): Promise<Warranty> {
    return this.unitOfWork.run(async (repositories) => {
      assertIdentifier(id);

      const record =
        await repositories.warranties.findById(id);

      if (!record) {
        throw new DomainError(
          'WARRANTY_NOT_FOUND',
          'La garantía no existe.',
        );
      }

      return record;
    });
  }

  changeStatus(
    id: number,
    status: ProcessStatus,
    resolution?: string,
  ): Promise<Warranty> {
    return this.unitOfWork.run(async (repositories) => {
      assertIdentifier(id);

      const record =
        await repositories.warranties.findById(id);

      if (!record) {
        throw new DomainError(
          'WARRANTY_NOT_FOUND',
          'La garantía no existe.',
        );
      }

      return repositories.warranties.save(
        changeWarrantyStatus(
          record,
          status,
          resolution,
        ),
      );
    });
  }
}
