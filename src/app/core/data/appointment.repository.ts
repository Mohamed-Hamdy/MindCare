import { Injectable } from '@angular/core';
import { RepositoryBase } from './repository.base';
import { Id } from '../models';

@Injectable({ providedIn: 'root' })
export class AppointmentRepository extends RepositoryBase<'appointments'> {
  constructor() {
    super('appointments');
  }

  async forDoctorOnDate(doctorId: Id, date: string) {
    const all = await this.getAll();
    return all.filter(
      (a) => a.doctorId === doctorId && a.date === date && a.status !== 'cancelled'
    );
  }

  async forPatient(patientId: Id) {
    const all = await this.getAll();
    return all
      .filter((a) => a.patientId === patientId)
      .sort((a, b) => (a.date + a.startTime < b.date + b.startTime ? 1 : -1));
  }

  /** Active live-queue entries: checked-in but not yet completed/cancelled. */
  async liveQueue(date: string) {
    const all = await this.getAll();
    return all.filter(
      (a) =>
        a.date === date &&
        ['waiting', 'in-exam', 'emergency'].includes(a.status)
    );
  }
}
