import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LabOrderRepository } from '../../../../core/data/lab-order.repository';
import { PatientRepository } from '../../../../core/data/patient.repository';
import { EmailService } from '../../../../core/services/email.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LabOrder, LabOrderStatus, Patient } from '../../../../core/models';

interface Row extends LabOrder {
  patientName: string;
  patientEmail: string;
}

const STEPS: LabOrderStatus[] = ['ordered', 'sample-collected', 'processing', 'ready', 'delivered'];
const LABEL_KEYS: Record<LabOrderStatus, string> = {
  ordered: 'lab.statusOrdered',
  'sample-collected': 'lab.statusSampleCollected',
  processing: 'lab.statusProcessing',
  ready: 'lab.statusReady',
  delivered: 'lab.statusDelivered',
};

@Component({
  selector: 'app-test-tracking',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  template: `
    <h5 class="cp-fw-800 mb-3"><i class="bi bi-clipboard2-pulse me-2 ms-2"></i>{{ 'lab.title' | translate }}</h5>

    @if (rows().length > 0) {
      <div class="d-flex align-items-center gap-2 mb-3">
        <select
          class="form-select form-select-sm"
          style="max-width: 220px;"
          [ngModel]="statusFilter()"
          (ngModelChange)="statusFilter.set($event)"
        >
          <option [ngValue]="null">{{ 'lab.filterStatus' | translate }}: {{ 'common.all' | translate }}</option>
          @for (s of steps; track s) {
            <option [ngValue]="s">{{ labelKey(s) | translate }}</option>
          }
        </select>
      </div>
    }

    @if (filteredRows().length === 0) {
      <div class="cp-card p-5 text-center cp-text-muted">{{ 'lab.none' | translate }}</div>
    }

    <div class="d-flex flex-column gap-2">
      @for (r of filteredRows(); track r.id) {
        <div class="cp-card p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <div class="fw-semibold">{{ r.testName }} <span class="cp-text-muted small">— {{ r.patientName }}</span></div>
            <div class="small cp-text-muted">{{ labelKey(r.status) | translate }}</div>
          </div>
          <div class="d-flex gap-2 align-items-center">
            @if (nextStatus(r.status); as next) {
              <button class="btn btn-sm btn-outline-primary" (click)="advance(r, next)">
                <i class="bi bi-arrow-left-circle me-1 ms-1"></i> {{ labelKey(next) | translate }}
              </button>
            } @else {
              <span class="badge text-bg-success">{{ 'lab.statusCompleted' | translate }}</span>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class TestTracking implements OnInit {
  private labOrderRepo = inject(LabOrderRepository);
  private patientRepo = inject(PatientRepository);
  private emailService = inject(EmailService);
  private notify = inject(NotificationService);
  private translate = inject(TranslateService);

  private orders = signal<LabOrder[]>([]);
  private patients = signal<Patient[]>([]);
  steps = STEPS;
  statusFilter = signal<LabOrderStatus | null>(null);

  rows = computed<Row[]>(() => {
    const patientsMap = new Map(this.patients().map((p) => [p.id, p]));
    return this.orders()
      .map((o) => ({
        ...o,
        patientName: patientsMap.get(o.patientId)?.fullName ?? '—',
        patientEmail: patientsMap.get(o.patientId)?.email ?? '',
      }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  });

  filteredRows = computed(() => {
    const filter = this.statusFilter();
    const all = this.rows();
    return filter ? all.filter((r) => r.status === filter) : all;
  });

  async ngOnInit(): Promise<void> {
    this.orders.set(await this.labOrderRepo.getAll());
    this.patients.set(await this.patientRepo.getAll());
  }

  labelKey(s: LabOrderStatus): string {
    return LABEL_KEYS[s];
  }

  nextStatus(current: LabOrderStatus): LabOrderStatus | null {
    const idx = STEPS.indexOf(current);
    return idx >= 0 && idx < STEPS.length - 1 ? STEPS[idx + 1] : null;
  }

  async advance(r: Row, next: LabOrderStatus): Promise<void> {
    const patch: Partial<LabOrder> = { status: next };
    if (next === 'ready') patch.readyAt = new Date().toISOString();

    await this.labOrderRepo.update(r.id, patch as any);
    this.orders.set(await this.labOrderRepo.getAll());

    if (next === 'ready') {
      await this.emailService.sendNotification(
        r.patientEmail,
        this.translate.instant('lab.resultReadySubject'),
        this.translate.instant('lab.resultReadyBody', { name: r.patientName, test: r.testName })
      );
      await this.labOrderRepo.update(r.id, { notifiedAt: new Date().toISOString() } as any);
      this.orders.set(await this.labOrderRepo.getAll());
    }
    this.notify.success(this.translate.instant('lab.updated'), `${r.testName}: ${this.translate.instant(this.labelKey(next))}`);
  }
}
