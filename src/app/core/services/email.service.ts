import { Injectable, inject } from '@angular/core';
import emailjs from '@emailjs/browser';
import { APP_CONFIG } from '../config/app-config';
import { NotificationService } from './notification.service';

/**
 * Generic transactional emails (lab result ready, low-stock digest, ...)
 * reusing the same EmailJS account as the OTP flow. Falls back to an
 * on-screen toast in demo mode, same spirit as OtpService.
 */
@Injectable({ providedIn: 'root' })
export class EmailService {
  private notify = inject(NotificationService);

  async sendNotification(toEmail: string, subject: string, message: string): Promise<boolean> {
    if (!toEmail) return false;

    if (APP_CONFIG.emailjs.isConfigured) {
      try {
        await emailjs.send(
          APP_CONFIG.emailjs.serviceId,
          APP_CONFIG.emailjs.notifyTemplateId || APP_CONFIG.emailjs.templateId,
          { to_email: toEmail, subject, message, clinic_name: APP_CONFIG.clinic.nameAr },
          { publicKey: APP_CONFIG.emailjs.publicKey }
        );
        return true;
      } catch (err) {
        console.warn('EmailJS notification failed, showing in-app fallback', err);
      }
    }

    this.notify.info(subject, `${message} (تم عرض الإشعار محليًا — البريد غير مُفعّل)`, 6000);
    return false;
  }
}
