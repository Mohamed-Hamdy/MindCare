import { Injectable } from '@angular/core';
import { RepositoryBase } from './repository.base';

@Injectable({ providedIn: 'root' })
export class LabOrderRepository extends RepositoryBase<'labOrders'> {
  constructor() {
    super('labOrders');
  }

  async pending() {
    const all = await this.getAll();
    return all.filter((o) => o.status !== 'delivered');
  }
}
