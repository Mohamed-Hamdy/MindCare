import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { v4 as uuid } from 'uuid';
import { LabTestTypeRepository } from '../../../../core/data/lab-test-type.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { LabTestType } from '../../../../core/models';

type TestForm = Omit<LabTestType, 'createdAt' | 'updatedAt'>;
const EMPTY: TestForm = { id: '', name: '', price: 0, turnaroundHours: 24, active: true };

@Component({
  selector: 'app-admin-services-tests',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h5 class="cp-fw-800 mb-0"><i class="bi bi-clipboard2-pulse me-2 ms-2"></i>{{ 'admin.testsTitle' | translate }}</h5>
      <button class="btn btn-primary btn-sm" (click)="openNew()"><i class="bi bi-plus-lg me-1 ms-1"></i> {{ 'admin.newTest' | translate }}</button>
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

    <div class="cp-card p-0">
      <div class="table-responsive">
        <table class="table table-hover mb-0 align-middle">
          <thead>
            <tr>
              <th class="ps-3">{{ 'admin.testName' | translate }}</th>
              <th>{{ 'common.price' | translate }}</th>
              <th>{{ 'admin.turnaround' | translate }}</th>
              <th>{{ 'common.status' | translate }}</th>
              <th class="pe-3">{{ 'common.actions' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (t of filteredTests(); track t.id) {
              <tr>
                <td class="ps-3 fw-semibold">{{ t.name }}</td>
                <td>{{ t.price }} {{ 'common.egp' | translate }}</td>
                <td>{{ t.turnaroundHours }} {{ 'common.hours' | translate }}</td>
                <td><span class="badge" [class.text-bg-success]="t.active" [class.text-bg-secondary]="!t.active">{{ (t.active ? 'common.active' : 'common.inactive') | translate }}</span></td>
                <td class="pe-3">
                  <button class="btn btn-sm btn-outline-secondary me-1 ms-1" (click)="openEdit(t)"><i class="bi bi-pencil"></i></button>
                  <button class="btn btn-sm btn-outline-danger" (click)="remove(t)"><i class="bi bi-trash"></i></button>
                </td>
              </tr>
            }
            @if (filteredTests().length === 0) {
              <tr><td colspan="5" class="text-center cp-text-muted small py-4">{{ 'common.noResults' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    @if (showModal()) {
      <div class="modal d-block" style="background: rgba(0,0,0,.5);" (click)="showModal.set(false)">
        <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
          <div class="modal-content cp-card border-0 p-3">
            <h6 class="fw-bold mb-3">{{ (form.id ? 'admin.editTest' : 'admin.newTest') | translate }}</h6>
            <div class="mb-2"><label class="form-label small">{{ 'admin.testName' | translate }}</label><input class="form-control" [(ngModel)]="form.name" /></div>
            <div class="row g-2">
              <div class="col-md-6"><label class="form-label small">{{ 'common.price' | translate }}</label><input class="form-control" type="number" [(ngModel)]="form.price" /></div>
              <div class="col-md-6"><label class="form-label small">{{ 'admin.turnaround' | translate }}</label><input class="form-control" type="number" [(ngModel)]="form.turnaroundHours" /></div>
            </div>
            <div class="form-check form-switch my-3">
              <input class="form-check-input" type="checkbox" [(ngModel)]="form.active" id="testActive" />
              <label class="form-check-label small" for="testActive">{{ 'common.active' | translate }}</label>
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
export class AdminServicesTests implements OnInit {
  private repo = inject(LabTestTypeRepository);
  private notify = inject(NotificationService);
  private translate = inject(TranslateService);

  tests = signal<LabTestType[]>([]);
  showModal = signal(false);
  form: TestForm = { ...EMPTY };

  search = signal('');
  statusFilter = signal<boolean | null>(null);

  filteredTests = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    return this.tests().filter((t) => {
      const matchesTerm = !term || t.name.toLowerCase().includes(term);
      const matchesStatus = status === null || t.active === status;
      return matchesTerm && matchesStatus;
    });
  });

  async ngOnInit(): Promise<void> {
    this.tests.set(await this.repo.getAll());
  }

  openNew(): void {
    this.form = { ...EMPTY, id: '' };
    this.showModal.set(true);
  }

  openEdit(t: LabTestType): void {
    this.form = { ...t };
    this.showModal.set(true);
  }

  async save(): Promise<void> {
    if (!this.form.name) {
      this.notify.warn(this.translate.instant('booking.missingFields'), this.translate.instant('admin.missingTestName'));
      return;
    }
    if (this.form.id) {
      await this.repo.update(this.form.id, { ...this.form } as any);
    } else {
      await this.repo.create({ ...this.form, id: uuid(), createdAt: '', updatedAt: '' } as any);
    }
    this.tests.set(await this.repo.getAll());
    this.showModal.set(false);
    this.notify.success(this.translate.instant('admin.saved'));
  }

  async remove(t: LabTestType): Promise<void> {
    await this.repo.remove(t.id);
    this.tests.set(await this.repo.getAll());
    this.notify.success(this.translate.instant('admin.deleted'));
  }
}
