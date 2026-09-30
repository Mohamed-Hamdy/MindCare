import { Injectable } from '@angular/core';
import { RepositoryBase } from './repository.base';
import { Id } from '../models';

@Injectable({ providedIn: 'root' })
export class DoctorRepository extends RepositoryBase<'doctors'> {
  constructor() {
    super('doctors');
  }

  async bySpecialty(specialtyId: Id) {
    const all = await this.getAll();
    return all.filter((d) => d.specialtyId === specialtyId && d.active);
  }
}
