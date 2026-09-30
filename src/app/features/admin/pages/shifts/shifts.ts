import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DoctorRepository } from '../../../../core/data/doctor.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { Doctor, WeeklyShift } from '../../../../core/models';

@Component({
  selector: 'app-admin-shifts',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  template: `
    <h5 class="cp-fw-800 mb-3"><i class="bi bi-calendar-week me-2 ms-2"></i>{{ 'admin.shiftsTitle' | translate }}</h5>

    <div class="cp-card p-3 mb-3">
      <label class="form-label small fw-semibold">{{ 'admin.chooseDoctor' | translate }}</label>
      <select class="form-select" [(ngModel)]="selectedDoctorId" (ngModelChange)="onSelect()">
        <option value="" disabled>{{ 'billing.choosePlaceholder' | translate }}</option>
        @for (d of doctors(); track d.id) {
          <option [value]="d.id">{{ d.fullName }}</option>
        }
      </select>
    </div>

    @if (selectedDoctor()) {
      <div class="cp-card p-3">
        <h6 class="fw-bold mb-3">{{ 'admin.doctorShiftsTitle' | translate: { name: selectedDoctor()!.fullName } }}</h6>

        <div class="table-responsive mb-3">
          <table class="table table-sm align-middle">
            <thead>
              <tr>
                <th>{{ 'admin.colDay' | translate }}</th>
                <th>{{ 'admin.colFrom' | translate }}</th>
                <th>{{ 'admin.colTo' | translate }}</th>
                <th>{{ 'admin.colSlotDuration' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (s of shifts(); track $index; let i = $index) {
                <tr>
                  <td class="small">{{ dayName(s.dayOfWeek) }}</td>
                  <td class="small">{{ s.startTime }}</td>
                  <td class="small">{{ s.endTime }}</td>
                  <td class="small">{{ s.slotDurationMinutes }}</td>
                  <td><button class="btn btn-sm btn-outline-danger" (click)="removeShift(i)"><i class="bi bi-trash"></i></button></td>
                </tr>
              }
              @if (shifts().length === 0) {
                <tr><td colspan="5" class="text-center cp-text-muted small py-3">{{ 'admin.noShifts' | translate }}</td></tr>
              }
            </tbody>
          </table>
        </div>

        <div class="row g-2 align-items-end mb-3">
          <div class="col-md-3">
            <label class="form-label small">{{ 'admin.colDay' | translate }}</label>
            <select class="form-select" [(ngModel)]="newDay">
              @for (d of dayOptions(); track d.value) {
                <option [value]="d.value">{{ d.label }}</option>
              }
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label small">{{ 'admin.colFrom' | translate }}</label>
            <input class="form-control" type="time" [(ngModel)]="newStart" />
          </div>
          <div class="col-md-2">
            <label class="form-label small">{{ 'admin.colTo' | translate }}</label>
            <input class="form-control" type="time" [(ngModel)]="newEnd" />
          </div>
          <div class="col-md-3">
            <label class="form-label small">{{ 'admin.colSlotDuration' | translate }}</label>
            <input class="form-control" type="number" [(ngModel)]="newSlotDuration" />
          </div>
          <div class="col-md-2">
            <button class="btn btn-outline-primary w-100" (click)="addShift()">
              <i class="bi bi-plus-lg"></i> {{ 'admin.addShift' | translate }}
            </button>
          </div>
        </div>

        <button class="btn btn-primary" (click)="saveShifts()">
          <i class="bi bi-save me-1 ms-1"></i> {{ 'admin.saveSchedule' | translate }}
        </button>
      </div>
    }
  `,
})
export class AdminShifts implements OnInit {
  private doctorRepo = inject(DoctorRepository);
  private notify = inject(NotificationService);
  private translate = inject(TranslateService);

  doctors = signal<Doctor[]>([]);
  selectedDoctorId = '';
  selectedDoctor = signal<Doctor | null>(null);
  shifts = signal<WeeklyShift[]>([]);

  dayOptions = () => {
    const days = this.translate.instant('common.weekdaysFull') as string[];
    return days.map((label, value) => ({ label, value }));
  };
  newDay = 0;
  newStart = '09:00';
  newEnd = '14:00';
  newSlotDuration = 15;

  async ngOnInit(): Promise<void> {
    this.doctors.set(await this.doctorRepo.getAll());
  }

  onSelect(): void {
    const doc = this.doctors().find((d) => d.id === this.selectedDoctorId) ?? null;
    this.selectedDoctor.set(doc);
    this.shifts.set(doc ? [...doc.shifts] : []);
  }

  dayName(dow: number): string {
    const days = this.translate.instant('common.weekdaysFull') as string[];
    return days[dow];
  }

  addShift(): void {
    this.shifts.update((list) => [
      ...list,
      { dayOfWeek: Number(this.newDay), startTime: this.newStart, endTime: this.newEnd, slotDurationMinutes: Number(this.newSlotDuration) },
    ]);
  }

  removeShift(i: number): void {
    this.shifts.update((list) => list.filter((_, idx) => idx !== i));
  }

  async saveShifts(): Promise<void> {
    const doc = this.selectedDoctor();
    if (!doc) return;
    const updated = await this.doctorRepo.update(doc.id, { shifts: this.shifts() } as any);
    if (updated) {
      this.selectedDoctor.set(updated);
      this.doctors.set(await this.doctorRepo.getAll());
    }
    this.notify.success(this.translate.instant('admin.scheduleSaved'));
  }
}
