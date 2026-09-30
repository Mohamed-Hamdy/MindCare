import { Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="toast-stack position-fixed top-0 start-50 translate-middle-x p-3" style="z-index: 1080; margin-top: 4rem;">
      @for (t of notify.toasts(); track t.id) {
        <div class="toast show cp-card border-0 mb-2 shadow" role="alert">
          <div class="d-flex align-items-start p-2">
            <div
              class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 me-2 ms-0"
              style="width: 34px; height: 34px;"
              [class.bg-success-subtle]="t.kind === 'success'"
              [class.bg-danger-subtle]="t.kind === 'danger'"
              [class.bg-warning-subtle]="t.kind === 'warning'"
              [class.bg-info-subtle]="t.kind === 'info'"
            >
              <i
                class="bi"
                [class.bi-check-circle-fill]="t.kind === 'success'"
                [class.text-success]="t.kind === 'success'"
                [class.bi-x-circle-fill]="t.kind === 'danger'"
                [class.text-danger]="t.kind === 'danger'"
                [class.bi-exclamation-triangle-fill]="t.kind === 'warning'"
                [class.text-warning]="t.kind === 'warning'"
                [class.bi-info-circle-fill]="t.kind === 'info'"
                [class.text-info]="t.kind === 'info'"
              ></i>
            </div>
            <div class="flex-grow-1">
              <div class="fw-bold small">{{ t.title }}</div>
              @if (t.body) {
                <div class="small cp-text-muted">{{ t.body }}</div>
              }
            </div>
            <button type="button" class="btn-close btn-sm" (click)="notify.dismiss(t.id)"></button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ToastContainer {
  protected notify = inject(NotificationService);
}
