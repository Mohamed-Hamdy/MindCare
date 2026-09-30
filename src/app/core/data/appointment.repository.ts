import { Injectable, inject } from '@angular/core';
import { RepositoryBase } from './repository.base';
import { Appointment, Id } from '../models';
import { BackendConfigService } from '../services/backend-config.service';
import { ApiClient } from './backend/api-client';
import { AppointmentDto, AppointmentStatusUpdateRequestDto } from './backend/dto.types';
import { appointmentFromDto, appointmentToBookingRequest, statusToBackend } from './backend/mappers';

@Injectable({ providedIn: 'root' })
export class AppointmentRepository extends RepositoryBase<'appointments'> {
  private backendConfig = inject(BackendConfigService);
  private api = inject(ApiClient);

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

  override async reload(): Promise<void> {
    if (this.backendConfig.isEnabled()) {
      const dtos = await this.api.get<AppointmentDto[]>('/api/appointments');
      const byId = new Map(this._items().map((a) => [a.id, a]));
      this._items.set(dtos.map((dto) => appointmentFromDto(dto, byId.get(dto.id))));
      return;
    }
    return super.reload();
  }

  /**
   * Booking via the backend hands slot-derivation, overlap-checking, and the
   * initial status (CONFIRMED, or EMERGENCY + immediate queue number) over to
   * AppointmentService.book() rather than trusting the client-computed
   * `endTime`/`status`/`queueNumber` this method is normally called with — see
   * backend/README.md's "Booking flow" section for why (it also means the
   * patient-portal's email-OTP step becomes a formality: the appointment is
   * already CONFIRMED by the time OTP verification runs).
   */
  override async create(entity: Appointment): Promise<Appointment> {
    if (this.backendConfig.isEnabled()) {
      const dto = await this.api.post<AppointmentDto>(
        '/api/appointments',
        appointmentToBookingRequest(entity)
      );
      await this.reload();
      return appointmentFromDto(dto, entity);
    }
    return super.create(entity);
  }

  /**
   * Only `status` (plus whatever side-effect fields the backend derives from
   * it — checkedInAt/startedAt/completedAt/queueNumber) is backed by a real
   * endpoint (`PATCH /api/appointments/{id}/status`). Every call site in this
   * app only ever patches `status` (see queue-board / patient-record /
   * booking), so that is all this needs to cover; a patch with no `status`
   * falls back to the local IndexedDB write as a safety net.
   */
  override async update(id: Id, patch: Partial<Appointment>): Promise<Appointment | undefined> {
    if (this.backendConfig.isEnabled() && patch.status) {
      const body: AppointmentStatusUpdateRequestDto = { status: statusToBackend(patch.status) };
      const dto = await this.api.patch<AppointmentDto>(`/api/appointments/${id}/status`, body);
      const existing = await this.getById(id);
      const updated = appointmentFromDto(dto, existing);
      await this.reload();
      return updated;
    }
    return super.update(id, patch);
  }
}
