import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ThemeToggle } from '../../shared/components/theme-toggle/theme-toggle';
import { LanguageToggle } from '../../shared/components/language-toggle/language-toggle';
import { ToastContainer } from '../../shared/components/toast-container/toast-container';
import { APP_CONFIG } from '../../core/config/app-config';

@Component({
  selector: 'app-public-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, ThemeToggle, LanguageToggle, ToastContainer, TranslatePipe],
  template: `
    <app-toast-container />
    <nav class="navbar navbar-expand-lg sticky-top cp-card rounded-0 border-0 border-bottom py-2">
      <div class="container">
        <a class="navbar-brand d-flex align-items-center gap-2 cp-fw-800" routerLink="/">
          <span
            class="rounded-3 d-inline-flex align-items-center justify-content-center text-white"
            style="width: 38px; height: 38px; background: var(--cp-primary);"
          >
            <i class="bi bi-heart-pulse-fill"></i>
          </span>
          <span>Mind<span style="color: var(--cp-primary)">Care</span></span>
        </a>
        <div class="d-flex align-items-center gap-2">
          <a routerLink="/my-appointments" class="btn btn-sm btn-outline-secondary d-none d-sm-inline-flex">
            <i class="bi bi-calendar2-check me-1 ms-1"></i> {{ 'nav.myAppointments' | translate }}
          </a>
          <a routerLink="/login" class="btn btn-sm btn-outline-primary">
            <i class="bi bi-person-badge me-1 ms-1"></i> {{ 'nav.staffLogin' | translate }}
          </a>
          <app-language-toggle />
          <app-theme-toggle />
        </div>
      </div>
    </nav>

    <main>
      <router-outlet />
    </main>

    <footer class="cp-surface-alt border-top py-4 mt-5">
      <div class="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 small cp-text-muted">
        <div>© {{ year }} {{ clinicName }} — {{ 'footer.rights' | translate }}</div>
        <div class="d-flex gap-3">
          <span><i class="bi bi-telephone me-1 ms-1"></i>{{ clinicPhone }}</span>
          <span><i class="bi bi-geo-alt me-1 ms-1"></i>{{ clinicAddress }}</span>
        </div>
      </div>
    </footer>
  `,
})
export class PublicShell {
  protected year = new Date().getFullYear();
  protected clinicName = APP_CONFIG.clinic.nameAr;
  protected clinicPhone = APP_CONFIG.clinic.phone;
  protected clinicAddress = APP_CONFIG.clinic.address;
}
