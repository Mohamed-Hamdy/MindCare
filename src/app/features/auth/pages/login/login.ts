import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="d-flex align-items-center justify-content-center py-5" style="min-height: 80vh;">
      <div class="cp-card p-4 p-md-5" style="width: 100%; max-width: 420px;">
        <div class="text-center mb-4">
          <span
            class="rounded-3 d-inline-flex align-items-center justify-content-center text-white mb-2"
            style="width: 52px; height: 52px; background: var(--cp-primary); font-size: 1.4rem;"
          >
            <i class="bi bi-heart-pulse-fill"></i>
          </span>
          <h4 class="cp-fw-800 mb-0">{{ 'login.title' | translate }}</h4>
          <p class="cp-text-muted small mb-0">{{ 'login.subtitle' | translate }}</p>
        </div>

        <form (ngSubmit)="submit()">
          <div class="mb-3">
            <label class="form-label small fw-semibold">{{ 'login.username' | translate }}</label>
            <input class="form-control" [(ngModel)]="username" name="username" autocomplete="username" required />
          </div>
          <div class="mb-3">
            <label class="form-label small fw-semibold">{{ 'login.password' | translate }}</label>
            <input
              class="form-control"
              type="password"
              [(ngModel)]="password"
              name="password"
              autocomplete="current-password"
              required
            />
          </div>
          @if (error()) {
            <div class="alert alert-danger py-2 small">{{ error() }}</div>
          }
          <button class="btn btn-primary w-100" type="submit" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner-border spinner-border-sm me-2 ms-2"></span>
            }
            {{ 'login.submit' | translate }}
          </button>
        </form>

        <div class="cp-surface-alt rounded-3 p-3 mt-4 small">
          <div class="fw-semibold mb-2"><i class="bi bi-info-circle me-1 ms-1"></i>{{ 'login.demoAccounts' | translate }}</div>
          <div class="d-flex flex-column gap-1 cp-text-muted">
            <span>admin / admin123 — {{ 'nav.roleAdmin' | translate }}</span>
            <span>reception / reception123 — {{ 'nav.roleReception' | translate }}</span>
            <span>doctor1 / doctor123 — {{ 'nav.roleDoctor' | translate }}</span>
            <span>pharmacy / pharmacy123 — {{ 'nav.rolePharmacy' | translate }}</span>
            <span>lab / lab123 — {{ 'nav.roleLab' | translate }}</span>
          </div>
        </div>

        <div class="text-center mt-3">
          <a routerLink="/" class="small">
            <i class="bi bi-arrow-right me-1 ms-1"></i> {{ 'login.backToPortal' | translate }}
          </a>
        </div>
      </div>
    </div>
  `,
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotificationService);
  private translate = inject(TranslateService);

  username = '';
  password = '';
  loading = signal(false);
  error = signal('');

  async submit(): Promise<void> {
    if (!this.username || !this.password) return;
    this.loading.set(true);
    this.error.set('');
    const user = await this.auth.login(this.username, this.password);
    this.loading.set(false);
    if (!user) {
      this.error.set(this.translate.instant('login.invalidCredentials'));
      return;
    }
    this.notify.success(this.translate.instant('login.welcomeBack'), user.fullName);
    this.router.navigateByUrl(this.auth.homeRouteForRole(user.role));
  }
}
