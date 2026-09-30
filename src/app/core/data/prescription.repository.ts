import { Injectable } from '@angular/core';
import { RepositoryBase } from './repository.base';
import { Id } from '../models';

@Injectable({ providedIn: 'root' })
export class PrescriptionRepository extends RepositoryBase<'prescriptions'> {
  constructor() {
    super('prescriptions');
  }

  async byAppointment(appointmentId: Id) {
    const all = await this.getAll();
    return all.find((p) => p.appointmentId === appointmentId);
  }

  async pendingDispense() {
    const all = await this.getAll();
    return all.filter((p) => !p.dispensed);
  }
}
