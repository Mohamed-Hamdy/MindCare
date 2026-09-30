import { Injectable, computed, inject, signal } from '@angular/core';
import { UserRepository } from '../data/user.repository';
import { AppUser, UserRole } from '../models';

const SESSION_KEY = 'cp_session_user_id';

/**
 * Simple client-side session. There is no backend, so "auth" here means
 * matching against the local Users store and remembering the signed-in
 * user's id in localStorage across reloads.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private userRepo = inject(UserRepository);

  readonly currentUser = signal<AppUser | null>(null);
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly role = computed<UserRole | null>(() => this.currentUser()?.role ?? null);

  async restoreSession(): Promise<void> {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return;
    const user = await this.userRepo.getById(id);
    if (user) this.currentUser.set(user);
  }

  async login(username: string, password: string): Promise<AppUser | null> {
    const user = await this.userRepo.byCredentials(username, password);
    if (!user) return null;
    this.currentUser.set(user);
    localStorage.setItem(SESSION_KEY, user.id);
    return user;
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem(SESSION_KEY);
  }

  homeRouteForRole(role: UserRole): string {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'reception':
        return '/reception';
      case 'doctor':
        return '/doctor';
      case 'pharmacy':
        return '/pharmacy';
      case 'lab':
        return '/lab';
    }
  }
}
