import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ThemeToggle } from '../../shared/components/theme-toggle/theme-toggle';
import { LanguageToggle } from '../../shared/components/language-toggle/language-toggle';
import { ToastContainer } from '../../shared/components/toast-container/toast-container';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models';

interface NavItem {
  labelKey: string;
  icon: string;
  path: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.dashboard', icon: 'bi-speedometer2', path: '/admin', roles: ['admin'] },
  { labelKey: 'nav.doctors', icon: 'bi-person-badge', path: '/admin/doctors', roles: ['admin'] },
  { labelKey: 'nav.specialties', icon: 'bi-diagram-3', path: '/admin/specialties', roles: ['admin'] },
  { labelKey: 'nav.medicines', icon: 'bi-capsule', path: '/admin/medicines', roles: ['admin'] },
  { labelKey: 'nav.servicesTests', icon: 'bi-clipboard2-pulse', path: '/admin/services-tests', roles: ['admin'] },
  { labelKey: 'nav.shifts', icon: 'bi-calendar-week', path: '/admin/shifts', roles: ['admin'] },
  { labelKey: 'nav.invoices', icon: 'bi-receipt', path: '/admin/invoices', roles: ['admin'] },

  { labelKey: 'nav.queue', icon: 'bi-people-fill', path: '/reception', roles: ['reception'] },
  { labelKey: 'nav.invoices', icon: 'bi-receipt', path: '/reception/invoices', roles: ['reception'] },

  { labelKey: 'nav.patients', icon: 'bi-person-lines-fill', path: '/doctor', roles: ['doctor'] },

  { labelKey: 'nav.inventory', icon: 'bi-capsule', path: '/pharmacy', roles: ['pharmacy'] },
  { labelKey: 'nav.dispense', icon: 'bi-prescription2', path: '/pharmacy/dispense', roles: ['pharmacy'] },

  { labelKey: 'nav.labOrders', icon: 'bi-clipboard2-pulse', path: '/lab', roles: ['lab'] },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ThemeToggle, LanguageToggle, ToastContainer, TranslatePipe],
  template: `
    <app-toast-container />
    <div class="cp-shell">
      <aside class="cp-sidebar p-3 d-flex flex-column" [class.show]="sidebarOpen()">
        <a routerLink="/" class="d-flex align-items-center gap-2 cp-fw-800 mb-4 text-decoration-none text-body">
          <span
            class="rounded-3 d-inline-flex align-items-center justify-content-center text-white"
            style="width: 36px; height: 36px; background: var(--cp-primary);"
          >
            <i class="bi bi-heart-pulse-fill"></i>
          </span>
          <span>Mind<span style="color: var(--cp-primary)">Care</span></span>
        </a>

        <nav class="d-flex flex-column gap-1 flex-grow-1 overflow-auto">
          @for (item of visibleItems(); track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.path === homePath() }"
              class="cp-nav-link"
              (click)="sidebarOpen.set(false)"
            >
              <i class="bi" [class]="item.icon"></i>
              <span>{{ item.labelKey | translate }}</span>
            </a>
          }
        </nav>

        <div class="border-top pt-3 mt-3">
          <div class="d-flex align-items-center gap-2 mb-2">
            <span
              class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
              style="width: 34px; height: 34px; background: var(--cp-primary);"
            >
              {{ initials() }}
            </span>
            <div class="small">
              <div class="fw-semibold">{{ auth.currentUser()?.fullName }}</div>
              <div class="cp-text-muted">{{ roleLabelKey() | translate }}</div>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2 mb-2">
            <app-language-toggle />
          </div>
          <button class="btn btn-sm btn-outline-danger w-100" (click)="logout()">
            <i class="bi bi-box-arrow-right me-1 ms-1"></i> {{ 'nav.logout' | translate }}
          </button>
        </div>
      </aside>

      <div class="cp-main">
        <header class="cp-card rounded-0 border-0 border-bottom d-flex align-items-center justify-content-between px-3 py-2 sticky-top">
          <button class="btn btn-outline-secondary d-lg-none" (click)="sidebarOpen.set(!sidebarOpen())">
            <i class="bi bi-list"></i>
          </button>
          <span class="fw-semibold d-none d-lg-block">{{ roleLabelKey() | translate }}</span>
          <app-theme-toggle />
        </header>
        <div class="p-3 p-lg-4">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
})
export class AppShell {
  protected auth = inject(AuthService);
  private router = inject(Router);
  protected sidebarOpen = signal(false);

  protected visibleItems = computed(() => {
    const role = this.auth.role();
    if (!role) return [];
    return NAV_ITEMS.filter((i) => i.roles.includes(role));
  });

  protected homePath = computed(() => (this.auth.role() ? this.auth.homeRouteForRole(this.auth.role()!) : '/'));

  protected initials = computed(() => {
    const name = this.auth.currentUser()?.fullName ?? '';
    return name
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0])
      .join('');
  });

  private roleLabelKeys(): Record<UserRole, string> {
    return {
      admin: 'nav.roleAdmin',
      reception: 'nav.roleReception',
      doctor: 'nav.roleDoctor',
      pharmacy: 'nav.rolePharmacy',
      lab: 'nav.roleLab',
    };
  }

  protected roleLabelKey = computed(() => this.roleLabelKeys()[this.auth.role() ?? 'admin']);

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
