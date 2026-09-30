import { Injectable } from '@angular/core';
import { RepositoryBase } from './repository.base';

@Injectable({ providedIn: 'root' })
export class InvoiceRepository extends RepositoryBase<'invoices'> {
  constructor() {
    super('invoices');
  }

  async nextInvoiceNumber(): Promise<string> {
    const all = await this.getAll();
    const year = new Date().getFullYear();
    return `CP-${year}-${String(all.length + 1).padStart(5, '0')}`;
  }
}
