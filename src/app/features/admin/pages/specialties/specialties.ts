import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { v4 as uuid } from 'uuid';
import { SpecialtyRepository } from '../../../../core/data/specialty.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { LanguageService } from '../../../../core/services/language.service';
import { Specialty } from '../../../../core/models';

const EMPTY: Omit<Specialty, 'createdAt' | 'updatedAt'> = {
  id: '',
  nameAr: '',
  nameEn: '',
  icon: 'bi-heart-pulse',
  description: '',
  active: true,
};

const ICONS = ['bi-heart-pulse', 'bi-emoji-smile', 'bi-bandaid', 'bi-bone', 'bi-gender-female', 'bi-emoji-laughing', 'bi-eye', 'bi-ear', 'bi-lungs', 'bi-droplet-half'];

@Component({
  selector: 'app-admin-specialties',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h5 class="cp-fw-800 mb-0"><i class="bi bi-diagram-3 me-2 ms-2"></i>{{ 'admin.specialtiesTitle' | translate }}</h5>
      <button class="btn btn-primary btn-sm" (click)="openNew()"><i class="bi bi-plus-lg me-1 ms-1"></i> {{ 'admin.newSpecialty' | translate }}</button>
    </div>

    <div class="cp-card p-3 mb-3 d-flex flex-wrap gap-2">
      <input
        class="form-control"
        style="max-width: 260px;"
        [placeholder]="'common.searchPlaceholder' | translate"
        [ngModel]="search()"
        (ngModelChange)="search.set($event)"
      />
      <select
        class="form-select"
        style="max-width: 180px;"
        [ngModel]="statusFilter()"
        (ngModelChange)="statusFilter.set($event)"
      >
        <option [ngValue]="null">{{ 'common.status' | translate }}: {{ 'common.all' | translate }}</option>
        <option [ngValue]="true">{{ 'common.active' | translate }}</option>
        <option [ngValue]="false">{{ 'common.inactive' | translate }}</option>
      </select>
    </div>

    <div class="row g-3">
      @for (s of filteredSpecialties(); track s.id) {
        <div class="col-md-4 col-lg-3">
          <div class="cp-card p-3 text-center">
            <div class="rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center" style="width: 50px; height: 50px; background: var(--cp-primary-light); color: var(--cp-primary);">
              <i class="bi" [class]="s.icon"></i>
            </div>
            <div class="fw-semibold">{{ s.nameAr }}</div>
            <div class="small cp-text-muted mb-2">{{ s.nameEn }}</div>
            <span class="badge mb-2" [class.text-bg-success]="s.active" [class.text-bg-secondary]="!s.active">{{ (s.active ? 'common.active' : 'common.inactive') | translate }}</span>
            <div class="d-flex gap-1 justify-content-center">
              <button class="btn btn-sm btn-outline-secondary" (click)="openEdit(s)"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-danger" (click)="remove(s)"><i class="bi bi-trash"></i></button>
            </div>
          </div>
        </div>
      }
      @if (filteredSpecialties().length === 0) {
        <div class="col-12">
          <div class="cp-card p-4 text-center cp-text-muted">{{ 'common.noResults' | translate }}</div>
        </div>
      }
    </div>

    @if (showModal()) {
      <div class="modal d-block" style="background: rgba(0,0,0,.5);" (click)="showModal.set(false)">
        <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
          <div class="modal-content cp-card border-0 p-3">
            <h6 class="fw-bold mb-3">{{ (form.id ? 'admin.editSpecialty' : 'admin.newSpecialty') | translate }}</h6>
            <div class="mb-2">
              <label class="form-label small">{{ 'admin.nameAr' | translate }}</label>
              <input class="form-control" [(ngModel)]="form.nameAr" />
            </div>
            <div class="mb-2">
              <label class="form-label small">{{ 'admin.nameEn' | translate }}</label>
              <input class="form-control" [(ngModel)]="form.nameEn" />
            </div>
            <div class="mb-2">
              <label class="form-label small">{{ 'admin.icon' | translate }}</label>
              <select class="form-select" [(ngModel)]="form.icon">
                @for (i of icons; track i) {
                  <option [value]="i">{{ i }}</option>
                }
              </select>
            </div>
            <div class="form-check form-switch mb-3">
              <input class="form-check-input" type="checkbox" [(ngModel)]="form.active" id="specActive" />
              <label class="form-check-label small" for="specActive">{{ 'common.active' | translate }}</label>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-secondary flex-fill" (click)="showModal.set(false)">{{ 'common.cancel' | translate }}</button>
              <button class="btn btn-primary flex-fill" (click)="save()">{{ 'common.save' | translate }}</button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminSpecialties implements OnInit {
  private repo = inject(SpecialtyRepository);
  private notify = inject(NotificationService);
  private translate = inject(TranslateService);
  protected lang = inject(LanguageService);

  specialties = signal<Specialty[]>([]);
  showModal = signal(false);
  form: Omit<Specialty, 'createdAt' | 'updatedAt'> = { ...EMPTY };
  icons = ICONS;

  search = signal('');
  statusFilter = signal<boolean | null>(null);

  filteredSpecialties = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    return this.specialties().filter((s) => {
      const matchesTerm = !term || s.nameAr.toLowerCase().includes(term) || s.nameEn.toLowerCase().includes(term);
      const matchesStatus = status === null || s.active === status;
      return matchesTerm && matchesStatus;
    });
  });

  async ngOnInit(): Promise<void> {
    this.specialties.set(await this.repo.getAll());
  }

  openNew(): void {
    this.form = { ...EMPTY, id: '' };
    this.showModal.set(true);
  }

  openEdit(s: Specialty): void {
    this.form = { ...s };
    this.showModal.set(true);
  }

  async save(): Promise<void> {
    if (!this.form.nameAr) {
      this.notify.warn(this.translate.instant('booking.missingFields'), this.translate.instant('admin.missingName'));
      return;
    }
    if (this.form.id) {
      await this.repo.update(this.form.id, { ...this.form } as any);
    } else {
      await this.repo.create({ ...this.form, id: uuid(), createdAt: '', updatedAt: '' } as any);
    }
    this.specialties.set(await this.repo.getAll());
    this.showModal.set(false);
    this.notify.success(this.translate.instant('admin.saved'));
  }

  async remove(s: Specialty): Promise<void> {
    await this.repo.remove(s.id);
    this.specialties.set(await this.repo.getAll());
    this.notify.success(this.translate.instant('admin.deleted'));
  }
}
