import { Injectable, inject } from '@angular/core';
import { RepositoryBase } from './repository.base';
import { Doctor, Id } from '../models';
import { BackendConfigService } from '../services/backend-config.service';
import { ApiClient } from './backend/api-client';
import { DoctorDto } from './backend/dto.types';
import { doctorFromDto, doctorToRequest } from './backend/mappers';

@Injectable({ providedIn: 'root' })
export class DoctorRepository extends RepositoryBase<'doctors'> {
  private backendConfig = inject(BackendConfigService);
  private api = inject(ApiClient);

  constructor() {
    super('doctors');
  }

  async bySpecialty(specialtyId: Id) {
    const all = await this.getAll();
    return all.filter((d) => d.specialtyId === specialtyId && d.active);
  }

  override async reload(): Promise<void> {
    if (this.backendConfig.isEnabled()) {
      const dtos = await this.api.get<DoctorDto[]>('/api/doctors');
      this._items.set(dtos.map(doctorFromDto));
      return;
    }
    return super.reload();
  }

  override async create(entity: Doctor): Promise<Doctor> {
    if (this.backendConfig.isEnabled()) {
      const dto = await this.api.post<DoctorDto>('/api/doctors', doctorToRequest(entity));
      await this.reload();
      return doctorFromDto(dto);
    }
    return super.create(entity);
  }

  override async update(id: Id, patch: Partial<Doctor>): Promise<Doctor | undefined> {
    if (this.backendConfig.isEnabled()) {
      const existing = await this.getById(id);
      if (!existing) return undefined;
      const merged = { ...existing, ...patch };
      const dto = await this.api.put<DoctorDto>(`/api/doctors/${id}`, doctorToRequest(merged));
      await this.reload();
      return doctorFromDto(dto);
    }
    return super.update(id, patch);
  }

  override async remove(id: Id): Promise<void> {
    if (this.backendConfig.isEnabled()) {
      await this.api.delete(`/api/doctors/${id}`);
      await this.reload();
      return;
    }
    return super.remove(id);
  }
}
