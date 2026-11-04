import { DomainError } from '../../domain/errors.js';
import type { ProcessStatus } from '../../domain/process-status.js';
import {
  assertReturnCapacity,
  changeReturnStatus,
  type SaleReturn,
} from '../../domain/returns/return.js';
import type { UnitOfWork } from '../../domain/unit-of-work.js';
import { assertIdentifier, assertQuantity, normalizeReason } from '../../domain/validation.js';
import { getPurchasedQuantity } from '../purchase-context.js';

export interface CreateReturnInput {
  readonly saleId: number;
  readonly productId: number;
  readonly quantity: number;
  readonly reason: string;
}

/** Casos de uso de devoluciones; no conoce HTTP ni el almacenamiento concreto. */
export class ReturnService {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Registra y reserva unidades sin superar lo comprado, incluidas las solicitudes anteriores. */
  create(input: CreateReturnInput): Promise<SaleReturn> {
    return this.unitOfWork.run(async (repositories) => {
      assertQuantity(input.quantity);
      const reason = normalizeReason(input.reason);
      const purchased = await getPurchasedQuantity(repositories, input.saleId, input.productId);
      const previous = await repositories.returns.findBySaleAndProduct(input.saleId, input.productId);
      assertReturnCapacity(purchased, previous, input.quantity);
      return repositories.returns.create({
        id_venta: input.saleId,
        id_producto: input.productId,
        cantidad: input.quantity,
        motivo: reason,
        fecha: this.now().toISOString(),
        estado: 'PENDING',
      });
    });
  }

  list(): Promise<readonly SaleReturn[]> {
    return this.unitOfWork.run((repositories) => repositories.returns.findAll());
  }

  getById(id: number): Promise<SaleReturn> {
    return this.unitOfWork.run(async (repositories) => {
      assertIdentifier(id);
      const record = await repositories.returns.findById(id);
      if (!record) throw new DomainError('RETURN_NOT_FOUND', 'La devolución no existe.');
      return record;
    });
  }

  changeStatus(id: number, status: ProcessStatus): Promise<SaleReturn> {
    return this.unitOfWork.run(async (repositories) => {
      assertIdentifier(id);
      const record = await repositories.returns.findById(id);
      if (!record) throw new DomainError('RETURN_NOT_FOUND', 'La devolución no existe.');
      return repositories.returns.save(changeReturnStatus(record, status));
    });
  }
}
