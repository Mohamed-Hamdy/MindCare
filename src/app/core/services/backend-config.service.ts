import { Injectable, signal } from '@angular/core';

const URL_KEY = 'cp_api_base_url';
const TOKEN_KEY = 'cp_api_token';
const QUERY_PARAM = 'apiUrl';

/**
 * Runtime toggle between the client-side-only build (IndexedDB, the default —
 * this is what ships on GitHub Pages, since a static host cannot run the
 * Spring Boot backend) and the real MindCare backend.
 *
 * There is no build-time environment file involved on purpose: flipping this
 * is just a localStorage flag (mirroring the existing `cp_lang` / `cp_theme_mode`
 * pattern), so the already-deployed static demo keeps working exactly as
 * today unless someone deliberately opts in.
 *
 * To opt in:
 *   - open the app with `?apiUrl=http://localhost:8080` once (the value is
 *     saved to localStorage and stripped from the URL), or
 *   - run `localStorage.setItem('cp_api_base_url', 'http://localhost:8080')`
 *     in the browser console, then reload.
 * To opt back out: `localStorage.removeItem('cp_api_base_url')` and reload.
 */
@Injectable({ providedIn: 'root' })
export class BackendConfigService {
  readonly baseUrl = signal<string | null>(this.readInitialUrl());

  constructor() {
    this.applyQueryParamIfPresent();
  }

  isEnabled(): boolean {
    return !!this.baseUrl();
  }

  setBaseUrl(url: string | null): void {
    const trimmed = url?.trim().replace(/\/+$/, '') || null;
    this.baseUrl.set(trimmed);
    if (trimmed) {
      localStorage.setItem(URL_KEY, trimmed);
    } else {
      localStorage.removeItem(URL_KEY);
    }
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  set token(value: string | null) {
    if (value) {
      localStorage.setItem(TOKEN_KEY, value);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  private readInitialUrl(): string | null {
    return localStorage.getItem(URL_KEY);
  }

  /** Lets `?apiUrl=...` be used as a one-time opt-in link without touching devtools. */
  private applyQueryParamIfPresent(): void {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get(QUERY_PARAM);
    if (!fromQuery) return;
    this.setBaseUrl(fromQuery);
    params.delete(QUERY_PARAM);
    const cleanUrl =
      window.location.pathname + (params.toString() ? `?${params.toString()}` : '') + window.location.hash;
    window.history.replaceState({}, '', cleanUrl);
  }
}
