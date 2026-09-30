import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BackendConfigService } from '../../services/backend-config.service';

interface BackendErrorBody {
  message?: string;
  error?: string;
}

/**
 * Thin promise-based wrapper around HttpClient for talking to the MindCare
 * Spring Boot backend. Every feature repository that supports backend mode
 * goes through this instead of calling HttpClient directly, so the base URL,
 * the JWT Authorization header, and error-message extraction stay in one place.
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private http = inject(HttpClient);
  private config = inject(BackendConfigService);

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  delete<T = void>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const baseUrl = this.config.baseUrl();
    if (!baseUrl) {
      throw new Error('Backend base URL is not configured.');
    }
    const headers = this.buildHeaders();
    try {
      return await firstValueFrom(
        this.http.request<T>(method, `${baseUrl}${path}`, { body, headers })
      );
    } catch (err) {
      throw new Error(this.extractMessage(err));
    }
  }

  private buildHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const token = this.config.token;
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private extractMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as BackendErrorBody | string | null;
      if (body && typeof body === 'object' && body.message) return body.message;
      if (err.status === 0) return 'Could not reach the MindCare backend. Is it running?';
      return err.message || `Backend request failed (${err.status})`;
    }
    return err instanceof Error ? err.message : 'Unknown backend error';
  }
}
