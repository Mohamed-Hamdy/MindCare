import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { v4 as uuid } from 'uuid';
import { MedicineRepository } from '../../../../core/data/medicine.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { Medicine } from '../../../../core/models';

type MedForm = Omit<Medicine, 'createdAt' | 'updatedAt'>;
const EMPTY: MedForm = { id: '', name: '', form: 'أقراص', strength: '', unitPrice: 0, quantityInStock: 0, minStockThreshold: 10, active: true };

@Component({
  selector: 'app-admin-medicines',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h5 class="cp-fw-800 mb-0"><i class="bi bi-capsule me-2 ms-2"></i>{{ 'admin.medicinesTitle' | translate }}</h5>
      <button class="btn btn-primary btn-sm" (click)="openNew()"><i class="bi bi-plus-lg me-1 ms-1"></i> {{ 'admin.newMedicine' | translate }}</button>
    </div>

    <div class="cp-card p-3 mb-3 d-flex flex-wrap align-items-center gap-2">
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
      <div class="form-check">
        <input
          class="form-check-input"
          type="checkbox"
          id="medLowStockOnly"
          [ngModel]="lowStockOnly()"
          (ngModelChange)="lowStockOnly.set($event)"
        />
        <label class="form-check-label small" for="medLowStockOnly">{{ 'pharmacy.filterLowStock' | translate }}</label>
      </div>
    </div>

    <div class="cp-card p-0">
      <div class="table-responsive">
        <table class="table table-hover mb-0 align-middle">
          <thead>
            <tr>
              <th class="ps-3">{{ 'common.name' | translate }}</th>
              <th>{{ 'admin.form' | translate }}</th>
              <th>{{ 'common.price' | translate }}</th>
              <th>{{ 'admin.stock' | translate }}</th>
              <th>{{ 'admin.minStock' | translate }}</th>
              <th>{{ 'common.status' | translate }}</th>
              <th class="pe-3">{{ 'common.actions' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (m of filteredMedicines(); track m.id) {
              <tr [class.table-warning]="m.quantityInStock <= m.minStockThreshold">
                <td class="ps-3 fw-semibold">{{ m.name }} <span class="small cp-text-muted">{{ m.strength }}</span></td>
                <td>{{ m.form }}</td>
                <td>{{ m.unitPrice }} {{ 'common.egp' | translate }}</td>
                <td>{{ m.quantityInStock }}</td>
                <td>{{ m.minStockThreshold }}</td>
                <td><span class="badge" [class.text-bg-success]="m.active" [class.text-bg-secondary]="!m.active">{{ (m.active ? 'common.active' : 'common.inactive') | translate }}</span></td>
                <td class="pe-3">
                  <button class="btn btn-sm btn-outline-secondary me-1 ms-1" (click)="openEdit(m)"><i class="bi bi-pencil"></i></button>
                  <button class="btn btn-sm btn-outline-danger" (click)="remove(m)"><i class="bi bi-trash"></i></button>
                </td>
              </tr>
            }
            @if (filteredMedicines().length === 0) {
              <tr><td colspan="7" class="text-center cp-text-muted small py-4">{{ 'common.noResults' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    @if (showModal()) {
      <div class="modal d-block" style="background: rgba(0,0,0,.5);" (click)="showModal.set(false)">
        <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
          <div class="modal-content cp-card border-0 p-3">
            <h6 class="fw-bold mb-3">{{ (form.id ? 'admin.editMedicine' : 'admin.newMedicine') | translate }}</h6>
            <div class="row g-2">
              <div class="col-md-7"><label class="form-label small">{{ 'common.name' | translate }}</label><input class="form-control" [(ngModel)]="form.name" /></div>
              <div class="col-md-5"><label class="form-label small">{{ 'admin.strength' | translate }}</label><input class="form-control" [(ngModel)]="form.strength" /></div>
              <div class="col-md-6"><label class="form-label small">{{ 'admin.form' | translate }}</label><input class="form-control" [(ngModel)]="form.form" /></div>
              <div class="col-md-6"><label class="form-label small">{{ 'common.price' | translate }}</label><input class="form-control" type="number" [(ngModel)]="form.unitPrice" /></div>
              <div class="col-md-6"><label class="form-label small">{{ 'admin.stock' | translate }}</label><input class="form-control" type="number" [(ngModel)]="form.quantityInStock" /></div>
              <div class="col-md-6"><label class="form-label small">{{ 'admin.minStock' | translate }}</label><input class="form-control" type="number" [(ngModel)]="form.minStockThreshold" /></div>
              <div class="col-12">
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" [(ngModel)]="form.active" id="medActive" />
                  <label class="form-check-label small" for="medActive">{{ 'common.active' | translate }}</label>
                </div>
              </div>
            </div>
            <div class="d-flex gap-2 mt-3">
              <button class="btn btn-outline-secondary flex-fill" (click)="showModal.set(false)">{{ 'common.cancel' | translate }}</button>
              <button class="btn btn-primary flex-fill" (click)="save()">{{ 'common.save' | translate }}</button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminMedicines implements OnInit {
  private repo = inject(MedicineRepository);
  private notify = inject(NotificationService);
  private translate = inject(TranslateService);

  medicines = signal<Medicine[]>([]);
  showModal = signal(false);
  form: MedForm = { ...EMPTY };

  search = signal('');
  statusFilter = signal<boolean | null>(null);
  lowStockOnly = signal(false);

  filteredMedicines = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    const lowStockOnly = this.lowStockOnly();
    return this.medicines().filter((m) => {
      const matchesTerm = !term || m.name.toLowerCase().includes(term);
      const matchesStatus = status === null || m.active === status;
      const matchesLowStock = !lowStockOnly || m.quantityInStock <= m.minStockThreshold;
      return matchesTerm && matchesStatus && matchesLowStock;
    });
  });

  async ngOnInit(): Promise<void> {
    this.medicines.set(await this.repo.getAll());
  }

  openNew(): void {
    this.form = { ...EMPTY, id: '' };
    this.showModal.set(true);
  }

  openEdit(m: Medicine): void {
    this.form = { ...m };
    this.showModal.set(true);
  }

  async save(): Promise<void> {
    if (!this.form.name) {
      this.notify.warn(this.translate.instant('booking.missingFields'), this.translate.instant('admin.missingMedicineName'));
      return;
    }
    if (this.form.id) {
      await this.repo.update(this.form.id, { ...this.form } as any);
    } else {
      await this.repo.create({ ...this.form, id: uuid(), createdAt: '', updatedAt: '' } as any);
    }
    this.medicines.set(await this.repo.getAll());
    this.showModal.set(false);
    this.notify.success(this.translate.instant('admin.saved'));
  }

  async remove(m: Medicine): Promise<void> {
    await this.repo.remove(m.id);
    this.medicines.set(await this.repo.getAll());
    this.notify.success(this.translate.instant('admin.deleted'));
  }
}
