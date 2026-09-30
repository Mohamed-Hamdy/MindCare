import { Injectable, inject } from '@angular/core';
import { APP_CONFIG } from '../config/app-config';
import { NotificationService } from './notification.service';

/**
 * Sends WhatsApp notifications through the configured Business API when
 * available, and automatically falls back to opening a wa.me deep link
 * otherwise (or if the API call fails) — exactly the
 * "التحويل التلقائي لرابط wa.me المباشر في حال انقطاع اتصال الـ API" behavior
 * requested in the brief.
 */
@Injectable({ providedIn: 'root' })
export class WhatsappService {
  private notify = inject(NotificationService);

  async sendMessage(phone: string, message: string): Promise<'api' | 'fallback'> {
    const normalizedPhone = this.normalize(phone);

    if (APP_CONFIG.whatsapp.isConfigured) {
      try {
        const res = await fetch(APP_CONFIG.whatsapp.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${APP_CONFIG.whatsapp.apiToken}`,
          },
          body: JSON.stringify({
            to: normalizedPhone,
            type: 'text',
            text: { body: message },
          }),
        });
        if (!res.ok) throw new Error(`WhatsApp API responded ${res.status}`);
        this.notify.success('تم إرسال إشعار واتساب', normalizedPhone);
        return 'api';
      } catch (err) {
        console.warn('WhatsApp API unreachable, falling back to wa.me link', err);
        this.openFallbackLink(normalizedPhone, message);
        return 'fallback';
      }
    }

    this.openFallbackLink(normalizedPhone, message);
    return 'fallback';
  }

  buildWaMeLink(phone: string, message: string): string {
    return `https://wa.me/${this.normalize(phone)}?text=${encodeURIComponent(message)}`;
  }

  private openFallbackLink(phone: string, message: string): void {
    const url = this.buildWaMeLink(phone, message);
    window.open(url, '_blank', 'noopener');
    this.notify.info('تم فتح واتساب', 'تم التحويل التلقائي إلى رابط wa.me لإتمام الإرسال');
  }

  private normalize(phone: string): string {
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = '20' + digits.slice(1); // Egypt default country code
    return digits;
  }
}
