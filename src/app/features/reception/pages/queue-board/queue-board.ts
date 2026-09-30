import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { v4 as uuid } from 'uuid';
import { AppointmentRepository } from '../../../../core/data/appointment.repository';
import { PatientRepository } from '../../../../core/data/patient.repository';
import { DoctorRepository } from '../../../../core/data/doctor.repository';
import { WhatsappService } from '../../../../core/services/whatsapp.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Appointment, AppointmentStatus, Doctor, Patient } from '../../../../core/models';
import { APP_CONFIG } from '../../../../core/config/app-config';

interface QueueCard extends Appointment {
  patientName: string;
  patientPhone: string;
  doctorName: string;
}

@Component({
  selector: 'app-queue-board',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h5 class="cp-fw-800 mb-0">
        <i class="bi bi-people-fill me-2 ms-2"></i>{{ 'reception.queueTitleWithDate' | translate: { date: today } }}
      </h5>
      <button class="btn btn-emergency btn-sm" (click)="showEmergencyModal.set(true)">
        <i class="bi bi-exclamation-triangle-fill me-1 ms-1"></i> {{ 'reception.addEmergency' | translate }}
      </button>
    </div>

    <!-- Filters -->
    <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
      <select
        class="form-select form-select-sm"
        style="max-width: 220px;"
        [ngModel]="doctorFilter()"
        (ngModelChange)="doctorFilter.set($event)"
      >
        <option [ngValue]="null">{{ 'reception.filterDoctor' | translate }}: {{ 'common.all' | translate }}</option>
        @for (d of doctors(); track d.id) {
          <option [ngValue]="d.id">{{ d.fullName }}</option>
        }
      </select>

      <select
        class="form-select form-select-sm"
        style="max-width: 220px;"
        [ngModel]="statusFilter()"
        (ngModelChange)="statusFilter.set($event)"
      >
        <option [ngValue]="null">{{ 'reception.filterStatus' | translate }}: {{ 'common.all' | translate }}</option>
        @for (col of columns; track col.status) {
          <option [ngValue]="col.status">{{ col.labelKey | translate }}</option>
        }
      </select>

      @if (doctorFilter() || statusFilter()) {
        <button type="button" class="btn btn-sm btn-outline-secondary" (click)="clearFilters()">
          <i class="bi bi-x-circle me-1 ms-1"></i>{{ 'common.clearFilters' | translate }}
        </button>
      }
    </div>

    <!-- Pending check-in -->
    <div class="cp-card p-3 mb-4">
      <h6 class="fw-bold mb-3"><i class="bi bi-clipboard2-check me-2 ms-2"></i>{{ 'reception.pendingCheckin' | translate }}</h6>
      @if (pendingCheckin().length === 0) {
        <div class="cp-text-muted small">{{ 'reception.noPendingCheckin' | translate }}</div>
      }
      <div class="d-flex flex-column gap-2">
        @for (a of pendingCheckin(); track a.id) {
          <div class="d-flex justify-content-between align-items-center border rounded-3 p-2 flex-wrap gap-2">
            <div>
              <div class="fw-semibold">{{ a.patientName }} <span class="cp-text-muted small">— {{ a.patientPhone }}</span></div>
              <div class="small cp-text-muted">{{ a.doctorName }} · {{ a.startTime }}</div>
            </div>
            <button class="btn btn-sm btn-primary" (click)="checkIn(a)">
              <i class="bi bi-box-arrow-in-left me-1 ms-1"></i> {{ 'reception.checkIn' | translate }}
            </button>
          </div>
        }
      </div>
    </div>

    <!-- Kanban -->
    <div class="row g-3">
      @for (col of visibleColumns(); track col.status) {
        <div class="col-md-6 col-lg-3">
          <div class="cp-card p-3 h-100">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <h6 class="fw-bold mb-0">{{ col.labelKey | translate }}</h6>
              <span class="badge rounded-pill text-bg-light">{{ byStatus(col.status).length }}</span>
            </div>
            <div class="d-flex flex-column gap-2" style="min-height: 80px;">
              @for (a of byStatus(col.status); track a.id) {
                <div class="border rounded-3 p-2" [class.border-danger]="a.status === 'emergency'">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <div class="fw-semibold small">{{ a.patientName }}</div>
                      <div class="cp-text-muted" style="font-size: .75rem;">{{ a.doctorName }}</div>
                    </div>
                    @if (a.queueNumber) {
                      <span class="badge text-bg-secondary">#{{ a.queueNumber }}</span>
                    }
                  </div>
                  <div class="d-flex gap-1 mt-2">
                    @if (a.status === 'waiting') {
                      <button class="btn btn-sm btn-outline-primary flex-fill" (click)="setStatus(a, 'in-exam')">
                        {{ 'reception.startExam' | translate }}
                      </button>
                    }
                    @if (a.status === 'in-exam') {
                      <button class="btn btn-sm btn-outline-success flex-fill" (click)="setStatus(a, 'completed')">
                        {{ 'reception.finishExam' | translate }}
                      </button>
                    }
                    @if (a.status === 'emergency') {
                      <button class="btn btn-sm btn-outline-primary flex-fill" (click)="setStatus(a, 'in-exam')">
                        {{ 'reception.startExam' | translate }}
                      </button>
                    }
                    @if (a.status !== 'completed') {
                      <button
                        class="btn btn-sm btn-outline-secondary"
                        (click)="notifyWhatsapp(a)"
                        [title]="'reception.sendWhatsapp' | translate"
                      >
                        <i class="bi bi-whatsapp"></i>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Emergency modal -->
    @if (showEmergencyModal()) {
      <div class="modal d-block" style="background: rgba(0,0,0,.5);" (click)="showEmergencyModal.set(false)">
        <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
          <div class="modal-content cp-card border-0 p-3">
            <h6 class="fw-bold mb-3">{{ 'reception.emergencyModalTitle' | translate }}</h6>
            <div class="mb-2">
              <label class="form-label small">{{ 'reception.patientName' | translate }}</label>
              <input class="form-control" [(ngModel)]="emName" />
            </div>
            <div class="mb-2">
              <label class="form-label small">{{ 'common.phone' | translate }}</label>
              <input class="form-control" [(ngModel)]="emPhone" />
            </div>
            <div class="mb-3">
              <label class="form-label small">{{ 'reception.doctor' | translate }}</label>
              <select class="form-select" [(ngModel)]="emDoctorId">
                @for (d of doctors(); track d.id) {
                  <option [value]="d.id">{{ d.fullName }}</option>
                }
              </select>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-secondary flex-fill" (click)="showEmergencyModal.set(false)">
                {{ 'reception.cancel' | translate }}
              </button>
              <button class="btn btn-emergency flex-fill" (click)="addEmergency()">
                {{ 'reception.addToQueue' | translate }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class QueueBoard implements OnInit {
  private appointmentRepo = inject(AppointmentRepository);
  private patientRepo = inject(PatientRepository);
  private doctorRepo = inject(DoctorRepository);
  private whatsapp = inject(WhatsappService);
  private notify = inject(NotificationService);
  private translate = inject(TranslateService);

  today = new Date().toISOString().slice(0, 10);
  private allAppointments = signal<Appointment[]>([]);
  private patients = signal<Patient[]>([]);
  doctors = signal<Doctor[]>([]);

  showEmergencyModal = signal(false);
  emName = '';
  emPhone = '';
  emDoctorId = '';

  doctorFilter = signal<string | null>(null);
  statusFilter = signal<AppointmentStatus | null>(null);

  columns: Array<{ status: AppointmentStatus; labelKey: string }> = [
    { status: 'waiting', labelKey: 'reception.colWaiting' },
    { status: 'in-exam', labelKey: 'reception.colInExam' },
    { status: 'completed', labelKey: 'reception.colCompleted' },
    { status: 'emergency', labelKey: 'reception.colEmergency' },
  ];

  visibleColumns = computed(() => {
    const filter = this.statusFilter();
    return filter ? this.columns.filter((c) => c.status === filter) : this.columns;
  });

  private enrichedToday = computed<QueueCard[]>(() => {
    const patientsMap = new Map(this.patients().map((p) => [p.id, p]));
    const doctorsMap = new Map(this.doctors().map((d) => [d.id, d]));
    const doctorFilter = this.doctorFilter();
    return this.allAppointments()
      .filter((a) => a.date === this.today && (!doctorFilter || a.doctorId === doctorFilter))
      .map((a) => ({
        ...a,
        patientName: patientsMap.get(a.patientId)?.fullName ?? '—',
        patientPhone: patientsMap.get(a.patientId)?.phone ?? '',
        doctorName: doctorsMap.get(a.doctorId)?.fullName ?? '—',
      }));
  });

  pendingCheckin = computed(() => this.enrichedToday().filter((a) => a.status === 'confirmed'));

  byStatus(status: AppointmentStatus): QueueCard[] {
    return this.enrichedToday().filter((a) => a.status === status);
  }

  clearFilters(): void {
    this.doctorFilter.set(null);
    this.statusFilter.set(null);
  }

  async ngOnInit(): Promise<void> {
    await this.refresh();
    this.doctors.set(await this.doctorRepo.getAll());
    if (this.doctors().length) this.emDoctorId = this.doctors()[0].id;
  }

  private async refresh(): Promise<void> {
    this.allAppointments.set(await this.appointmentRepo.getAll());
    this.patients.set(await this.patientRepo.getAll());
  }

  async checkIn(a: QueueCard): Promise<void> {
    const queueNumber = this.byStatus('waiting').length + this.byStatus('in-exam').length + this.byStatus('completed').length + 1;
    await this.appointmentRepo.update(a.id, {
      status: 'waiting',
      queueNumber,
      checkedInAt: new Date().toISOString(),
    } as any);
    await this.refresh();
    const message = this.translate.instant('reception.checkinWhatsappMessage', {
      name: a.patientName,
      clinic: APP_CONFIG.clinic.nameAr,
      queue: queueNumber,
    });
    await this.whatsapp.sendMessage(a.patientPhone, message);
  }

  async setStatus(a: QueueCard, status: AppointmentStatus): Promise<void> {
    const patch: Partial<Appointment> = { status };
    if (status === 'in-exam') patch.startedAt = new Date().toISOString();
    if (status === 'completed') patch.completedAt = new Date().toISOString();
    await this.appointmentRepo.update(a.id, patch as any);
    await this.refresh();
  }

  async notifyWhatsapp(a: QueueCard): Promise<void> {
    const message = this.translate.instant('reception.reminderWhatsappMessage', {
      clinic: APP_CONFIG.clinic.nameAr,
      doctor: a.doctorName,
      time: a.startTime,
    });
    await this.whatsapp.sendMessage(a.patientPhone, message);
  }

  async addEmergency(): Promise<void> {
    if (!this.emName || !this.emPhone || !this.emDoctorId) {
      this.notify.warn(this.translate.instant('reception.missingData'), this.translate.instant('reception.missingDataMsg'));
      return;
    }
    let patient = await this.patientRepo.byPhone(this.emPhone);
    if (!patient) {
      patient = await this.patientRepo.create({
        id: uuid(),
        fullName: this.emName,
        phone: this.emPhone,
        email: '',
        gender: 'male',
        medicalHistory: { attachments: [] },
        vitals: [],
        createdAt: '',
        updatedAt: '',
      } as any);
    }
    const doc = this.doctors().find((d) => d.id === this.emDoctorId)!;
    const now = new Date();
    const queueNumber = this.byStatus('waiting').length + this.byStatus('in-exam').length + this.byStatus('completed').length + 1;
    await this.appointmentRepo.create({
      id: uuid(),
      patientId: patient!.id,
      doctorId: doc.id,
      specialtyId: doc.specialtyId,
      date: this.today,
      startTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      endTime: '',
      status: 'emergency',
      isEmergency: true,
      queueNumber,
      checkedInAt: now.toISOString(),
      createdAt: '',
      updatedAt: '',
    } as any);
    this.showEmergencyModal.set(false);
    this.emName = '';
    this.emPhone = '';
    await this.refresh();
    this.notify.success(this.translate.instant('reception.emergencyAdded'));
  }
}
