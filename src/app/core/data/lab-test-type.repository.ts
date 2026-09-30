import { Injectable } from '@angular/core';
import { RepositoryBase } from './repository.base';

@Injectable({ providedIn: 'root' })
export class LabTestTypeRepository extends RepositoryBase<'labTestTypes'> {
  constructor() {
    super('labTestTypes');
  }
}
