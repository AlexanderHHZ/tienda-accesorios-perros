import { ReturnService } from '../src/application/returns/return-service.js';
import { WarrantyService } from '../src/application/warranties/warranty-service.js';
import { InMemoryUnitOfWork, type MemoryData } from '../src/infrastructure/repositories/in-memory-unit-of-work.js';
import { demoData } from '../src/mock/data.js';

export const fixedDate = '2026-09-27T22:00:00.000Z';

export function createFixture(seed: MemoryData = demoData) {
  const unitOfWork = new InMemoryUnitOfWork(seed);
  return {
    unitOfWork,
    returns: new ReturnService(unitOfWork, () => new Date(fixedDate)),
    warranties: new WarrantyService(unitOfWork, () => new Date(fixedDate)),
  };
}
