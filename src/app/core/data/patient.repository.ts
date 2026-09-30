import { Injectable, inject } from '@angular/core';
import { RepositoryBase } from './repository.base';
import { Id, Patient } from '../models';
import { BackendConfigService } from '../services/backend-config.service';
import { ApiClient } from './backend/api-client';
import { PatientDto } from './backend/dto.types';
import { patientFromDto, patientToRequest } from './backend/mappers';

@Injectable({ providedIn: 'root' })
export class PatientRepository extends RepositoryBase<'patients'> {
  private backendConfig = inject(BackendConfigService);
  private api = inject(ApiClient);

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

  override async reload(): Promise<void> {
    if (this.backendConfig.isEnabled()) {
      const dtos = await this.api.get<PatientDto[]>('/api/patients');
      const byId = new Map(this._items().map((p) => [p.id, p]));
      this._items.set(dtos.map((dto) => patientFromDto(dto, byId.get(dto.id))));
      return;
    }
    return super.reload();
  }

  override async create(entity: Patient): Promise<Patient> {
    if (this.backendConfig.isEnabled()) {
      const dto = await this.api.post<PatientDto>('/api/patients', patientToRequest(entity));
      const created = patientFromDto(dto, entity);
      await this.reload();
      return created;
    }
    return super.create(entity);
  }

  override async update(id: Id, patch: Partial<Patient>): Promise<Patient | undefined> {
    if (this.backendConfig.isEnabled()) {
      const existing = await this.getById(id);
      if (!existing) return undefined;
      const merged: Patient = {
        ...existing,
        ...patch,
        medicalHistory: { ...existing.medicalHistory, ...patch.medicalHistory },
      };
      const dto = await this.api.put<PatientDto>(`/api/patients/${id}`, patientToRequest(merged));
      const updated = patientFromDto(dto, merged);
      await this.reload();
      return updated;
    }
    return super.update(id, patch);
  }

  // Patients are never hard-deleted from the UI today (no call site), and the
  // backend has no DELETE /api/patients/{id} endpoint yet either, so `remove()`
  // intentionally keeps the inherited IndexedDB-only behavior.
}
