import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'danger' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
}

/** Lightweight, dependency-free toast bus rendered by shared/toast-container. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 1;
  readonly toasts = signal<ToastMessage[]>([]);

  show(kind: ToastKind, title: string, body?: string, timeoutMs = 4500): void {
    const toast: ToastMessage = { id: this.nextId++, kind, title, body };
    this.toasts.update((list) => [...list, toast]);
    if (timeoutMs > 0) {
      setTimeout(() => this.dismiss(toast.id), timeoutMs);
    }
  }

  success(title: string, body?: string, timeoutMs?: number) {
    this.show('success', title, body, timeoutMs);
  }
  error(title: string, body?: string, timeoutMs?: number) {
    this.show('danger', title, body, timeoutMs);
  }
  warn(title: string, body?: string, timeoutMs?: number) {
    this.show('warning', title, body, timeoutMs);
  }
  info(title: string, body?: string, timeoutMs?: number) {
    this.show('info', title, body, timeoutMs);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
