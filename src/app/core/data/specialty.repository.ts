import { Injectable, inject } from '@angular/core';
import { RepositoryBase } from './repository.base';
import { Id, Specialty } from '../models';
import { BackendConfigService } from '../services/backend-config.service';
import { ApiClient } from './backend/api-client';
import { SpecialtyDto } from './backend/dto.types';
import { specialtyFromDto, specialtyToRequest } from './backend/mappers';

@Injectable({ providedIn: 'root' })
export class SpecialtyRepository extends RepositoryBase<'specialties'> {
  private backendConfig = inject(BackendConfigService);
  private api = inject(ApiClient);

  constructor() {
    super('specialties');
  }

  override async reload(): Promise<void> {
    if (this.backendConfig.isEnabled()) {
      const dtos = await this.api.get<SpecialtyDto[]>('/api/specialties');
      this._items.set(dtos.map(specialtyFromDto));
      return;
    }
    return super.reload();
  }

  override async create(entity: Specialty): Promise<Specialty> {
    if (this.backendConfig.isEnabled()) {
      const dto = await this.api.post<SpecialtyDto>('/api/specialties', specialtyToRequest(entity));
      await this.reload();
      return specialtyFromDto(dto);
    }
    return super.create(entity);
  }

  override async update(id: Id, patch: Partial<Specialty>): Promise<Specialty | undefined> {
    if (this.backendConfig.isEnabled()) {
      const existing = await this.getById(id);
      if (!existing) return undefined;
      const merged = { ...existing, ...patch };
      const dto = await this.api.put<SpecialtyDto>(`/api/specialties/${id}`, specialtyToRequest(merged));
      await this.reload();
      return specialtyFromDto(dto);
    }
    return super.update(id, patch);
  }

  override async remove(id: Id): Promise<void> {
    if (this.backendConfig.isEnabled()) {
      await this.api.delete(`/api/specialties/${id}`);
      await this.reload();
      return;
    }
    return super.remove(id);
  }
}
