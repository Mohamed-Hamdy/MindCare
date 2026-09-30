import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AppointmentRepository } from '../../../../core/data/appointment.repository';
import { PatientRepository } from '../../../../core/data/patient.repository';
import { AuthService } from '../../../../core/services/auth.service';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { Appointment, AppointmentStatus, Patient } from '../../../../core/models';

interface Row extends Appointment {
  patientName: string;
  patientPhone: string;
}

const STATUS_OPTIONS: AppointmentStatus[] = ['waiting', 'in-exam', 'completed', 'confirmed', 'emergency'];

@Component({
  selector: 'app-doctor-patient-list',
  standalone: true,
  imports: [StatusBadge, TranslatePipe, FormsModule],
  template: `
    <h5 class="cp-fw-800 mb-3">
      <i class="bi bi-person-lines-fill me-2 ms-2"></i>{{ 'doctorList.title' | translate: { date: today } }}
    </h5>

    @if (rows().length > 0) {
      <div class="d-flex align-items-center gap-2 mb-3">
        <select
          class="form-select form-select-sm"
          style="max-width: 220px;"
          [ngModel]="statusFilter()"
          (ngModelChange)="statusFilter.set($event)"
        >
          <option [ngValue]="null">{{ 'doctorList.filterStatus' | translate }}: {{ 'common.all' | translate }}</option>
          @for (s of statusOptions; track s) {
            <option [ngValue]="s">{{ statusLabelKey(s) | translate }}</option>
          }
        </select>
      </div>
    }

    @if (filteredRows().length === 0) {
      <div class="cp-card p-5 text-center cp-text-muted">{{ 'doctorList.none' | translate }}</div>
    }

    <div class="d-flex flex-column gap-2">
      @for (r of filteredRows(); track r.id) {
        <div class="cp-card p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div class="d-flex align-items-center gap-3">
            @if (r.queueNumber) {
              <span
                class="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                style="width: 40px; height: 40px; background: var(--cp-primary);"
              >
                {{ r.queueNumber }}
              </span>
            }
            <div>
              <div class="fw-semibold">{{ r.patientName }}</div>
              <div class="small cp-text-muted">{{ r.startTime }} · {{ r.patientPhone }}</div>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <app-status-badge [status]="r.status" />
            <button class="btn btn-sm btn-primary" (click)="open(r)">
              <i class="bi bi-file-medical me-1 ms-1"></i> {{ 'doctorList.openFile' | translate }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class DoctorPatientList implements OnInit {
  private appointmentRepo = inject(AppointmentRepository);
  private patientRepo = inject(PatientRepository);
  private auth = inject(AuthService);
  private router = inject(Router);

  today = new Date().toISOString().slice(0, 10);
  private appointments = signal<Appointment[]>([]);
  private patients = signal<Patient[]>([]);
  statusFilter = signal<AppointmentStatus | null>(null);
  statusOptions = STATUS_OPTIONS;

  rows = computed<Row[]>(() => {
    const doctorId = this.auth.currentUser()?.linkedDoctorId;
    const patientsMap = new Map(this.patients().map((p) => [p.id, p]));
    return this.appointments()
      .filter((a) => a.doctorId === doctorId && a.date === this.today && a.status !== 'cancelled')
      .map((a) => ({
        ...a,
        patientName: patientsMap.get(a.patientId)?.fullName ?? '—',
        patientPhone: patientsMap.get(a.patientId)?.phone ?? '',
      }))
      .sort((a, b) => (a.queueNumber ?? 99) - (b.queueNumber ?? 99));
  });

  filteredRows = computed(() => {
    const filter = this.statusFilter();
    const all = this.rows();
    return filter ? all.filter((r) => r.status === filter) : all;
  });

  async ngOnInit(): Promise<void> {
    this.appointments.set(await this.appointmentRepo.getAll());
    this.patients.set(await this.patientRepo.getAll());
  }

  open(r: Row): void {
    this.router.navigate(['/doctor/patient', r.id]);
  }

  statusLabelKey(status: AppointmentStatus): string {
    const map: Record<AppointmentStatus, string> = {
      'pending-otp': 'status.pendingOtp',
      confirmed: 'status.confirmed',
      waiting: 'status.waiting',
      'in-exam': 'status.inExam',
      completed: 'status.completed',
      cancelled: 'status.cancelled',
      emergency: 'status.emergency',
    };
    return map[status];
  }
}
