import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { v4 as uuid } from 'uuid';
import { DoctorRepository } from '../../../../core/data/doctor.repository';
import { SpecialtyRepository } from '../../../../core/data/specialty.repository';
import { AppointmentRepository } from '../../../../core/data/appointment.repository';
import { PatientRepository } from '../../../../core/data/patient.repository';
import { OtpService } from '../../../../core/services/otp.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { RatingStars } from '../../../../shared/components/rating-stars/rating-stars';
import { LanguageService } from '../../../../core/services/language.service';
import { AttachmentFile, Doctor, Specialty } from '../../../../core/models';
import { APP_CONFIG } from '../../../../core/config/app-config';

type Step = 'slot' | 'details' | 'otp' | 'success';

interface TimeSlot {
  start: string;
  end: string;
  taken: boolean;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [FormsModule, RouterLink, RatingStars, TranslatePipe],
  template: `
    @if (doctor(); as doc) {
      <div class="container py-4" style="max-width: 900px;">
        <a routerLink="/" class="small d-inline-flex align-items-center gap-1 mb-3">
          <i class="bi bi-arrow-right"></i> {{ 'booking.backToDoctors' | translate }}
        </a>

        <div class="cp-card p-3 d-flex align-items-center gap-3 mb-4">
          <span
            class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
            style="width: 60px; height: 60px; font-size: 1.2rem;"
            [style.background]="doc.avatarColor"
          >
            {{ initials(doc.fullName) }}
          </span>
          <div class="flex-grow-1">
            <div class="fw-bold fs-5">{{ doc.fullName }}</div>
            <div class="small cp-text-muted">{{ doc.title }} — {{ specialtyName() }}</div>
            <app-rating-stars [rating]="doc.rating" [count]="doc.ratingCount" />
          </div>
          <div class="text-center">
            <div class="small cp-text-muted">{{ 'home.consultationFee' | translate }}</div>
            <div class="fw-bold fs-5" style="color: var(--cp-primary);">
              {{ doc.consultationFee }} {{ 'common.egp' | translate }}
            </div>
          </div>
        </div>

        <!-- Stepper -->
        <div class="d-flex justify-content-between mb-4 small">
          @for (s of stepsMeta; track s.key) {
            <div class="text-center flex-fill" [class.fw-bold]="step() === s.key" [style.color]="step() === s.key ? 'var(--cp-primary)' : ''">
              <div
                class="rounded-circle mx-auto mb-1 d-flex align-items-center justify-content-center"
                style="width: 30px; height: 30px;"
                [style.background]="stepIndex(s.key) <= stepIndex(step()) ? 'var(--cp-primary)' : 'var(--cp-surface-alt)'"
                [style.color]="stepIndex(s.key) <= stepIndex(step()) ? '#fff' : ''"
              >
                <i class="bi" [class]="s.icon"></i>
              </div>
              {{ s.labelKey | translate }}
            </div>
          }
        </div>

        <!-- Step 1: Smart slot picker -->
        @if (step() === 'slot') {
          <div class="cp-card p-4">
            <h6 class="fw-bold mb-3"><i class="bi bi-calendar3 me-2 ms-2"></i>{{ 'booking.chooseDateTime' | translate }}</h6>
            <div class="row g-2 mb-3">
              @for (d of upcomingDates(); track d.iso) {
                <div class="col-3 col-md-2">
                  <button
                    type="button"
                    class="btn w-100 py-2"
                    [class.btn-primary]="selectedDate() === d.iso"
                    [class.btn-outline-secondary]="selectedDate() !== d.iso"
                    [disabled]="d.slotsCount === 0"
                    (click)="selectDate(d.iso)"
                  >
                    <div class="small">{{ d.weekday }}</div>
                    <div class="fw-bold">{{ d.day }}</div>
                  </button>
                </div>
              }
            </div>

            @if (selectedDate()) {
              @if (slots().length === 0) {
                <div class="alert alert-warning small">{{ 'booking.noSlots' | translate }}</div>
              } @else {
                <div class="row g-2">
                  @for (slot of slots(); track slot.start) {
                    <div class="col-4 col-md-3 col-lg-2">
                      <button
                        type="button"
                        class="btn w-100 btn-sm"
                        [class.btn-primary]="selectedSlot()?.start === slot.start"
                        [class.btn-outline-secondary]="selectedSlot()?.start !== slot.start && !slot.taken"
                        [class.btn-outline-danger]="slot.taken"
                        [disabled]="slot.taken"
                        (click)="selectSlot(slot)"
                      >
                        {{ slot.start }}
                      </button>
                    </div>
                  }
                </div>
              }
            }

            <div class="text-end mt-4">
              <button class="btn btn-primary" [disabled]="!selectedSlot()" (click)="step.set('details')">
                {{ 'common.next' | translate }} <i class="bi bi-arrow-left ms-1 me-1"></i>
              </button>
            </div>
          </div>
        }

        <!-- Step 2: Patient details + medical history -->
        @if (step() === 'details') {
          <div class="cp-card p-4">
            <h6 class="fw-bold mb-3"><i class="bi bi-person-vcard me-2 ms-2"></i>{{ 'booking.patientData' | translate }}</h6>
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label class="form-label small fw-semibold">{{ 'common.fullName' | translate }} *</label>
                <input class="form-control" [(ngModel)]="patientName" name="patientName" required />
              </div>
              <div class="col-md-3">
                <label class="form-label small fw-semibold">{{ 'common.phone' | translate }} *</label>
                <input class="form-control" [(ngModel)]="patientPhone" name="patientPhone" required />
              </div>
              <div class="col-md-3">
                <label class="form-label small fw-semibold">{{ 'common.gender' | translate }}</label>
                <select class="form-select" [(ngModel)]="patientGender" name="patientGender">
                  <option value="male">{{ 'common.male' | translate }}</option>
                  <option value="female">{{ 'common.female' | translate }}</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-semibold">{{ 'booking.emailForOtp' | translate }}</label>
                <input class="form-control" type="email" [(ngModel)]="patientEmail" name="patientEmail" required />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-semibold">{{ 'booking.reasonForVisit' | translate }}</label>
                <input class="form-control" [(ngModel)]="reasonForVisit" name="reasonForVisit" />
              </div>
            </div>

            <h6 class="fw-bold mb-3 mt-4"><i class="bi bi-file-medical me-2 ms-2"></i>{{ 'booking.medicalForm' | translate }}</h6>
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label class="form-label small fw-semibold">{{ 'booking.chronicDiseases' | translate }}</label>
                <input class="form-control" [(ngModel)]="chronicDiseases" name="chronicDiseases" />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-semibold">{{ 'booking.allergies' | translate }}</label>
                <input class="form-control" [(ngModel)]="allergies" name="allergies" />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-semibold">{{ 'booking.currentMedications' | translate }}</label>
                <input class="form-control" [(ngModel)]="currentMedications" name="currentMedications" />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-semibold">{{ 'booking.previousSurgeries' | translate }}</label>
                <input class="form-control" [(ngModel)]="previousSurgeries" name="previousSurgeries" />
              </div>
              <div class="col-12">
                <label class="form-label small fw-semibold">{{ 'booking.uploadLabImages' | translate }}</label>
                <input class="form-control" type="file" accept="image/*" multiple (change)="onFilesSelected($event)" />
                @if (attachments().length > 0) {
                  <div class="d-flex flex-wrap gap-2 mt-2">
                    @for (a of attachments(); track a.id) {
                      <div class="position-relative">
                        <img [src]="a.base64" class="rounded-3 border" style="width: 70px; height: 70px; object-fit: cover;" />
                        <button
                          type="button"
                          class="btn btn-sm btn-danger rounded-circle position-absolute"
                          style="width: 22px; height: 22px; padding: 0; top: -6px; left: -6px; line-height: 1;"
                          (click)="removeAttachment(a.id)"
                        >
                          <i class="bi bi-x small"></i>
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <div class="d-flex justify-content-between mt-4">
              <button class="btn btn-outline-secondary" (click)="step.set('slot')">
                <i class="bi bi-arrow-right ms-1 me-1"></i> {{ 'common.back' | translate }}
              </button>
              <button class="btn btn-primary" [disabled]="!canSubmitDetails() || submitting()" (click)="submitAndSendOtp()">
                @if (submitting()) {
                  <span class="spinner-border spinner-border-sm me-2 ms-2"></span>
                }
                {{ 'booking.confirmAndSendOtp' | translate }} <i class="bi bi-arrow-left ms-1 me-1"></i>
              </button>
            </div>
          </div>
        }

        <!-- Step 3: OTP -->
        @if (step() === 'otp') {
          <div class="cp-card p-4 text-center" style="max-width: 480px; margin: 0 auto;">
            <i class="bi bi-shield-lock fs-1 mb-2" style="color: var(--cp-primary);"></i>
            <h6 class="fw-bold">{{ 'booking.enterOtp' | translate }}</h6>
            <p class="small cp-text-muted">{{ 'booking.otpSentTo' | translate }} {{ patientEmail }}</p>

            <input
              class="form-control form-control-lg text-center fw-bold mb-2"
              style="letter-spacing: 0.5rem; font-size: 1.6rem;"
              maxlength="6"
              inputmode="numeric"
              [(ngModel)]="otpInput"
              name="otpInput"
              placeholder="——————"
            />

            @if (otpError()) {
              <div class="alert alert-danger py-2 small">{{ otpError() }}</div>
            }

            <div class="small cp-text-muted mb-3">
              @if (countdown() > 0) {
                {{ 'booking.otpExpiresIn' | translate }} <span class="fw-bold">{{ formattedCountdown() }}</span>
              } @else {
                <span class="text-danger">{{ 'booking.otpExpired' | translate }}</span>
              }
              · {{ 'booking.attemptsRemaining' | translate }}: {{ maxAttempts - attemptsUsed() }}
            </div>

            <button class="btn btn-primary w-100 mb-2" [disabled]="otpInput.length !== 6 || verifying()" (click)="verifyOtp()">
              @if (verifying()) {
                <span class="spinner-border spinner-border-sm me-2 ms-2"></span>
              }
              {{ 'common.confirm' | translate }}
            </button>
            <button class="btn btn-link btn-sm" [disabled]="countdown() > 0" (click)="resendOtp()">
              {{ 'booking.resendOtp' | translate }}
            </button>
          </div>
        }

        <!-- Step 4: Success -->
        @if (step() === 'success') {
          <div class="cp-card p-5 text-center">
            <i class="bi bi-check-circle-fill fs-1 mb-2" style="color: var(--cp-success);"></i>
            <h5 class="fw-bold mb-1">{{ 'booking.successTitle' | translate }}</h5>
            <p class="cp-text-muted">
              {{ 'booking.successMessage' | translate: { doctor: doc.fullName, date: selectedDate(), time: selectedSlot()?.start } }}
            </p>
            <a routerLink="/" class="btn btn-primary mt-2">
              <i class="bi bi-house ms-1 me-1"></i> {{ 'booking.backHome' | translate }}
            </a>
          </div>
        }
      </div>
    } @else {
      <div class="container py-5 text-center cp-text-muted">{{ 'common.loading' | translate }}</div>
    }
  `,
})
export class Booking implements OnInit {
  private route = inject(ActivatedRoute);
  private doctorRepo = inject(DoctorRepository);
  private specialtyRepo = inject(SpecialtyRepository);
  private appointmentRepo = inject(AppointmentRepository);
  private patientRepo = inject(PatientRepository);
  private otpService = inject(OtpService);
  private notify = inject(NotificationService);
  private translate = inject(TranslateService);
  protected lang = inject(LanguageService);

  protected stepsMeta: Array<{ key: Step; labelKey: string; icon: string }> = [
    { key: 'slot', labelKey: 'booking.stepSlot', icon: 'bi-calendar3' },
    { key: 'details', labelKey: 'booking.stepDetails', icon: 'bi-person-vcard' },
    { key: 'otp', labelKey: 'booking.stepOtp', icon: 'bi-shield-lock' },
    { key: 'success', labelKey: 'booking.stepSuccess', icon: 'bi-check2' },
  ];

  doctor = signal<Doctor | null>(null);
  private specialties = signal<Specialty[]>([]);
  specialtyName = computed(() => {
    const s = this.specialties().find((sp) => sp.id === this.doctor()?.specialtyId);
    if (!s) return '';
    return this.lang.lang() === 'ar' ? s.nameAr : s.nameEn;
  });

  step = signal<Step>('slot');
  selectedDate = signal<string | null>(null);
  selectedSlot = signal<TimeSlot | null>(null);
  slots = signal<TimeSlot[]>([]);
  private existingAppointments = signal<{ startTime: string }[]>([]);

  patientName = '';
  patientPhone = '';
  patientEmail = '';
  patientGender: 'male' | 'female' = 'male';
  reasonForVisit = '';
  chronicDiseases = '';
  allergies = '';
  currentMedications = '';
  previousSurgeries = '';
  attachments = signal<AttachmentFile[]>([]);

  submitting = signal(false);
  appointmentId = '';
  challengeId = '';
  otpInput = '';
  otpError = signal('');
  verifying = signal(false);
  attemptsUsed = signal(0);
  maxAttempts = APP_CONFIG.otp.maxAttempts;
  countdown = signal(0);
  private countdownHandle: any;

  async ngOnInit(): Promise<void> {
    const doctorId = this.route.snapshot.paramMap.get('doctorId')!;
    const doc = await this.doctorRepo.getById(doctorId);
    this.doctor.set(doc ?? null);
    this.specialties.set(await this.specialtyRepo.getAll());
  }

  stepIndex(key: Step): number {
    return this.stepsMeta.findIndex((s) => s.key === key);
  }

  upcomingDates(): Array<{ iso: string; day: string; weekday: string; slotsCount: number }> {
    const doc = this.doctor();
    if (!doc) return [];
    const weekdayNames = this.translate.instant('common.weekdaysShort') as string[];
    const out: Array<{ iso: string; day: string; weekday: string; slotsCount: number }> = [];
    for (let i = 0; i < 8; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const iso = date.toISOString().slice(0, 10);
      const dow = date.getDay();
      const shiftsForDay = doc.shifts.filter((s) => s.dayOfWeek === dow);
      const slotsCount = shiftsForDay.reduce((sum, s) => sum + this.countSlotsInShift(s), 0);
      out.push({ iso, day: date.getDate().toString(), weekday: weekdayNames[dow], slotsCount });
    }
    return out;
  }

  private countSlotsInShift(shift: { startTime: string; endTime: string; slotDurationMinutes: number }): number {
    const [sh, sm] = shift.startTime.split(':').map(Number);
    const [eh, em] = shift.endTime.split(':').map(Number);
    const totalMinutes = eh * 60 + em - (sh * 60 + sm);
    return Math.max(0, Math.floor(totalMinutes / shift.slotDurationMinutes));
  }

  async selectDate(iso: string): Promise<void> {
    this.selectedDate.set(iso);
    this.selectedSlot.set(null);
    const doc = this.doctor()!;
    const dow = new Date(iso + 'T00:00:00').getDay();
    const shiftsForDay = doc.shifts.filter((s) => s.dayOfWeek === dow);

    const existing = await this.appointmentRepo.forDoctorOnDate(doc.id, iso);
    const takenTimes = new Set(existing.map((a) => a.startTime));

    const now = new Date();
    const isToday = iso === now.toISOString().slice(0, 10);

    const generated: TimeSlot[] = [];
    for (const shift of shiftsForDay) {
      let [h, m] = shift.startTime.split(':').map(Number);
      const [eh, em] = shift.endTime.split(':').map(Number);
      while (h * 60 + m + shift.slotDurationMinutes <= eh * 60 + em) {
        const start = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        m += shift.slotDurationMinutes;
        const endH = h + Math.floor(m / 60);
        const endM = m % 60;
        const end = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

        const isPast = isToday && h * 60 + (m - shift.slotDurationMinutes) < now.getHours() * 60 + now.getMinutes();
        generated.push({ start, end, taken: takenTimes.has(start) || isPast });

        h = endH % 24;
        m = endM;
      }
    }
    this.slots.set(generated);
  }

  selectSlot(slot: TimeSlot): void {
    if (slot.taken) return;
    this.selectedSlot.set(slot);
  }

  canSubmitDetails(): boolean {
    return !!(this.patientName && this.patientPhone && this.patientEmail);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        this.attachments.update((list) => [
          ...list,
          { id: uuid(), name: file.name, mimeType: file.type, base64: reader.result as string, uploadedAt: new Date().toISOString() },
        ]);
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  removeAttachment(id: string): void {
    this.attachments.update((list) => list.filter((a) => a.id !== id));
  }

  async submitAndSendOtp(): Promise<void> {
    const doc = this.doctor();
    const slot = this.selectedSlot();
    const date = this.selectedDate();
    if (!doc || !slot || !date) return;

    this.submitting.set(true);
    try {
      let patient = await this.patientRepo.byPhone(this.patientPhone);
      if (!patient) {
        patient = await this.patientRepo.create({
          id: uuid(),
          fullName: this.patientName,
          phone: this.patientPhone,
          email: this.patientEmail,
          gender: this.patientGender,
          medicalHistory: {
            chronicDiseases: this.chronicDiseases,
            allergies: this.allergies,
            currentMedications: this.currentMedications,
            previousSurgeries: this.previousSurgeries,
            attachments: this.attachments(),
          },
          vitals: [],
          createdAt: '',
          updatedAt: '',
        } as any);
      } else {
        await this.patientRepo.update(patient.id, {
          medicalHistory: {
            chronicDiseases: this.chronicDiseases,
            allergies: this.allergies,
            currentMedications: this.currentMedications,
            previousSurgeries: this.previousSurgeries,
            attachments: this.attachments(),
          },
        } as any);
      }

      const appointment = await this.appointmentRepo.create({
        id: uuid(),
        patientId: patient!.id,
        doctorId: doc.id,
        specialtyId: doc.specialtyId,
        date,
        startTime: slot.start,
        endTime: slot.end,
        status: 'pending-otp',
        reasonForVisit: this.reasonForVisit,
        isEmergency: false,
        createdAt: '',
        updatedAt: '',
      } as any);
      this.appointmentId = appointment.id;

      const result = await this.otpService.sendOtp(this.patientEmail, 'booking-confirmation', appointment.id);
      this.challengeId = result.challengeId;
      this.attemptsUsed.set(0);
      this.otpError.set('');
      this.startCountdown(result.expiresAt);
      this.step.set('otp');
    } finally {
      this.submitting.set(false);
    }
  }

  private startCountdown(expiresAtIso: string): void {
    clearInterval(this.countdownHandle);
    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAtIso).getTime() - Date.now()) / 1000));
      this.countdown.set(remaining);
      if (remaining <= 0) clearInterval(this.countdownHandle);
    };
    tick();
    this.countdownHandle = setInterval(tick, 1000);
  }

  formattedCountdown(): string {
    const total = this.countdown();
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  async verifyOtp(): Promise<void> {
    this.verifying.set(true);
    this.otpError.set('');
    try {
      const result = await this.otpService.verifyOtp(this.challengeId, this.otpInput);
      if (result.ok) {
        await this.appointmentRepo.update(this.appointmentId, { status: 'confirmed' } as any);
        clearInterval(this.countdownHandle);
        this.notify.success(this.translate.instant('booking.bookingConfirmedTitle'), this.translate.instant('booking.bookingConfirmedBody'));
        this.step.set('success');
        return;
      }
      const challenge = await this.otpService.getChallenge(this.challengeId);
      this.attemptsUsed.set(challenge?.attemptsUsed ?? this.attemptsUsed() + 1);
      switch (result.reason) {
        case 'invalid-code':
          this.otpError.set(this.translate.instant('booking.otpInvalid'));
          break;
        case 'expired':
          this.otpError.set(this.translate.instant('booking.otpExpiredMsg'));
          break;
        case 'max-attempts':
          this.otpError.set(this.translate.instant('booking.otpMaxAttempts'));
          break;
        default:
          this.otpError.set(this.translate.instant('booking.otpGenericError'));
      }
    } finally {
      this.verifying.set(false);
    }
  }

  async resendOtp(): Promise<void> {
    const result = await this.otpService.sendOtp(this.patientEmail, 'booking-confirmation', this.appointmentId);
    this.challengeId = result.challengeId;
    this.attemptsUsed.set(0);
    this.otpInput = '';
    this.otpError.set('');
    this.startCountdown(result.expiresAt);
  }

  initials(name: string): string {
    return name.replace('د.', '').trim().split(' ').slice(0, 2).map((p) => p[0]).join('');
  }
}
