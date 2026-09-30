import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { PatientRepository } from '../../../../core/data/patient.repository';
import { AppointmentRepository } from '../../../../core/data/appointment.repository';
import { DoctorRepository } from '../../../../core/data/doctor.repository';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { Appointment, AppointmentStatus, Doctor } from '../../../../core/models';

const STATUS_OPTIONS: AppointmentStatus[] = ['pending-otp', 'confirmed', 'waiting', 'in-exam', 'completed', 'cancelled', 'emergency'];

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [FormsModule, StatusBadge, TranslatePipe],
  template: `
    <div class="container py-4" style="max-width: 700px;">
      <h5 class="cp-fw-800 mb-3"><i class="bi bi-calendar2-check me-2 ms-2"></i>{{ 'myAppointments.title' | translate }}</h5>
      <div class="cp-card p-3 mb-4 d-flex gap-2">
        <input
          class="form-control"
          [placeholder]="'myAppointments.searchPlaceholder' | translate"
          [(ngModel)]="phone"
          (keyup.enter)="search()"
        />
        <button class="btn btn-primary" (click)="search()">{{ 'common.search' | translate }}</button>
      </div>

      @if (searched()) {
        @if (appointments().length > 0) {
          <div class="d-flex align-items-center gap-2 mb-3">
            <select
              class="form-select form-select-sm"
              style="max-width: 220px;"
              [ngModel]="statusFilter()"
              (ngModelChange)="statusFilter.set($event)"
            >
              <option [ngValue]="null">{{ 'myAppointments.filterStatus' | translate }}: {{ 'common.all' | translate }}</option>
              @for (s of statusOptions; track s) {
                <option [ngValue]="s">{{ statusLabelKey(s) | translate }}</option>
              }
            </select>
          </div>
        }

        @if (filteredAppointments().length === 0) {
          <div class="cp-card p-4 text-center cp-text-muted">{{ 'myAppointments.noneFound' | translate }}</div>
        }
        <div class="d-flex flex-column gap-2">
          @for (a of filteredAppointments(); track a.id) {
            <div class="cp-card p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <div class="fw-semibold">{{ doctorName(a.doctorId) }}</div>
                <div class="small cp-text-muted">{{ a.date }} — {{ a.startTime }}</div>
              </div>
              <app-status-badge [status]="a.status" />
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class MyAppointments {
  private patientRepo = inject(PatientRepository);
  private appointmentRepo = inject(AppointmentRepository);
  private doctorRepo = inject(DoctorRepository);

  phone = '';
  searched = signal(false);
  appointments = signal<Appointment[]>([]);
  private doctors = signal<Doctor[]>([]);
  statusFilter = signal<AppointmentStatus | null>(null);
  statusOptions = STATUS_OPTIONS;

  filteredAppointments = computed(() => {
    const filter = this.statusFilter();
    const all = this.appointments();
    return filter ? all.filter((a) => a.status === filter) : all;
  });

  async search(): Promise<void> {
    this.doctors.set(await this.doctorRepo.getAll());
    const patient = await this.patientRepo.byPhone(this.phone.trim());
    this.searched.set(true);
    this.statusFilter.set(null);
    if (!patient) {
      this.appointments.set([]);
      return;
    }
    this.appointments.set(await this.appointmentRepo.forPatient(patient.id));
  }

  doctorName(id: string): string {
    return this.doctors().find((d) => d.id === id)?.fullName ?? '';
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
