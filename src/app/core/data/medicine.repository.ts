import { Injectable } from '@angular/core';
import { RepositoryBase } from './repository.base';

@Injectable({ providedIn: 'root' })
export class MedicineRepository extends RepositoryBase<'medicines'> {
  constructor() {
    super('medicines');
  }

  async lowStock() {
    const all = await this.getAll();
    return all.filter((m) => m.quantityInStock <= m.minStockThreshold);
  }

  /** Deducts stock atomically-ish (best-effort in IndexedDB) when a prescription is dispensed. */
  async deductStock(medicineId: string, quantity: number) {
    const med = await this.getById(medicineId);
    if (!med) return undefined;
    const newQty = Math.max(0, med.quantityInStock - quantity);
    return this.update(medicineId, { quantityInStock: newQty } as any);
  }
}
