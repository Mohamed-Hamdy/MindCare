import { Injectable } from '@angular/core';
import { RepositoryBase } from './repository.base';

@Injectable({ providedIn: 'root' })
export class PatientRepository extends RepositoryBase<'patients'> {
  constructor() {
    super('patients');
  }

  async byPhone(phone: string) {
    const all = await this.getAll();
    return all.find((p) => p.phone === phone);
  }

  async byEmail(email: string) {
    const all = await this.getAll();
    return all.find((p) => p.email.toLowerCase() === email.toLowerCase());
  }
}
