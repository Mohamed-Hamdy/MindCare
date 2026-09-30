import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppointmentStatus } from '../../../core/models';

const KEYS: Record<AppointmentStatus, string> = {
  'pending-otp': 'status.pendingOtp',
  confirmed: 'status.confirmed',
  waiting: 'status.waiting',
  'in-exam': 'status.inExam',
  completed: 'status.completed',
  cancelled: 'status.cancelled',
  emergency: 'status.emergency',
};

const ICONS: Record<AppointmentStatus, string> = {
  'pending-otp': 'bi-hourglass-split',
  confirmed: 'bi-check2',
  waiting: 'bi-clock-history',
  'in-exam': 'bi-activity',
  completed: 'bi-check-circle-fill',
  cancelled: 'bi-x-circle',
  emergency: 'bi-exclamation-triangle-fill',
};

const CLASS_MAP: Record<AppointmentStatus, string> = {
  'pending-otp': 'cp-status--waiting',
  confirmed: 'cp-status--in-exam',
  waiting: 'cp-status--waiting',
  'in-exam': 'cp-status--in-exam',
  completed: 'cp-status--completed',
  cancelled: 'cp-status--cancelled',
  emergency: 'cp-status--emergency',
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <span class="cp-status" [class]="cssClass()">
      <i class="bi" [class]="icon()"></i>
      {{ labelKey() | translate }}
    </span>
  `,
})
export class StatusBadge {
  status = input.required<AppointmentStatus>();
  labelKey = computed(() => KEYS[this.status()]);
  icon = computed(() => ICONS[this.status()]);
  cssClass = computed(() => CLASS_MAP[this.status()]);
}
