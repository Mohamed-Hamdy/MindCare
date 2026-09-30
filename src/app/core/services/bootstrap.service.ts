import { Injectable, inject } from '@angular/core';
import { SeedService } from '../data/seed.service';
import { AuthService } from './auth.service';

/**
 * Single source of truth for "has the app finished seeding IndexedDB and
 * restoring the session yet?". Both the root component (for the splash
 * screen) and the route guards await the *same* promise, so a hard refresh
 * straight into a protected URL never races the guard against an
 * unfinished `AuthService.restoreSession()`.
 */
@Injectable({ providedIn: 'root' })
export class BootstrapService {
  private seed = inject(SeedService);
  private auth = inject(AuthService);
  private readyPromise: Promise<void> | null = null;

  ready(): Promise<void> {
    if (!this.readyPromise) {
      this.readyPromise = (async () => {
        await this.seed.seedIfNeeded();
        await this.auth.restoreSession();
      })();
    }
    return this.readyPromise;
  }
}
