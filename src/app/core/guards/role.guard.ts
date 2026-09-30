import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { BootstrapService } from '../services/bootstrap.service';
import { UserRole } from '../models';

/**
 * Route-level guard restricting a lazy-loaded section to specific roles.
 * Awaits `BootstrapService.ready()` first so a hard refresh straight into a
 * protected URL (e.g. reloading /admin) never runs before the session has
 * been restored from localStorage.
 */
export function roleGuard(...allowed: UserRole[]): CanMatchFn {
  return async () => {
    const bootstrap = inject(BootstrapService);
    const auth = inject(AuthService);
    const router = inject(Router);

    await bootstrap.ready();
    const role = auth.role();

    if (!role) {
      return router.createUrlTree(['/login']);
    }
    if (!allowed.includes(role)) {
      return router.createUrlTree([auth.homeRouteForRole(role)]);
    }
    return true;
  };
}
