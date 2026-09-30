import { Injectable, computed, inject, signal } from '@angular/core';
import { UserRepository } from '../data/user.repository';
import { ApiClient } from '../data/backend/api-client';
import { LoginResponseDto, UserDto } from '../data/backend/dto.types';
import { userFromDto } from '../data/backend/mappers';
import { AppUser, UserRole } from '../models';
import { BackendConfigService } from './backend-config.service';

const SESSION_KEY = 'cp_session_user_id';

/**
 * Client-side session by default: "auth" means matching against the local
 * Users store (IndexedDB) and remembering the signed-in user's id across
 * reloads — this is what runs on the static GitHub Pages demo, which has no
 * backend to call.
 *
 * When backend mode is on (see BackendConfigService), login instead calls the
 * real `/api/auth/login` endpoint, which returns a JWT; the token is kept in
 * localStorage and sent as a Bearer header by ApiClient, and session restore
 * calls `/api/auth/me` to re-validate it rather than trusting a stale local id.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private userRepo = inject(UserRepository);
  private backendConfig = inject(BackendConfigService);
  private api = inject(ApiClient);

  readonly currentUser = signal<AppUser | null>(null);
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly role = computed<UserRole | null>(() => this.currentUser()?.role ?? null);

  async restoreSession(): Promise<void> {
    if (this.backendConfig.isEnabled()) {
      if (!this.backendConfig.token) return;
      try {
        const dto = await this.api.get<UserDto>('/api/auth/me');
        this.currentUser.set(userFromDto(dto));
      } catch {
        // Stale/expired token — fall through to a signed-out state rather
        // than throwing during app bootstrap.
        this.backendConfig.token = null;
      }
      return;
    }

    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return;
    const user = await this.userRepo.getById(id);
    if (user) this.currentUser.set(user);
  }

  async login(username: string, password: string): Promise<AppUser | null> {
    if (this.backendConfig.isEnabled()) {
      try {
        const res = await this.api.post<LoginResponseDto>('/api/auth/login', { username, password });
        this.backendConfig.token = res.token;
        const user = userFromDto(res.user);
        this.currentUser.set(user);
        return user;
      } catch {
        return null;
      }
    }

    const user = await this.userRepo.byCredentials(username, password);
    if (!user) return null;
    this.currentUser.set(user);
    localStorage.setItem(SESSION_KEY, user.id);
    return user;
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem(SESSION_KEY);
    if (this.backendConfig.isEnabled()) {
      this.backendConfig.token = null;
    }
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
