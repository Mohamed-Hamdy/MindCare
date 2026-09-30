import { Injectable } from '@angular/core';
import { RepositoryBase } from './repository.base';

@Injectable({ providedIn: 'root' })
export class SpecialtyRepository extends RepositoryBase<'specialties'> {
  constructor() {
    super('specialties');
  }
}
