import { Injectable, inject } from '@angular/core';
import emailjs from '@emailjs/browser';
import { v4 as uuid } from 'uuid';
import { OtpRepository } from '../data/otp.repository';
import { NotificationService } from './notification.service';
import { APP_CONFIG } from '../config/app-config';
import { Id, OtpChallenge } from '../models';

export interface OtpSendResult {
  challengeId: Id;
  expiresAt: string;
  demoCode?: string; // only populated when EmailJS isn't configured (demo mode)
}

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: 'invalid-code' | 'expired' | 'max-attempts' | 'not-found' };

/**
 * Six-digit OTP flow, delivered by email via EmailJS, with a 5-minute
 * countdown and a capped number of verification attempts.
 */
@Injectable({ providedIn: 'root' })
export class OtpService {
  private repo = inject(OtpRepository);
  private notify = inject(NotificationService);

  async sendOtp(
    targetEmail: string,
    purpose: OtpChallenge['purpose'],
    refId?: Id
  ): Promise<OtpSendResult> {
    const code = this.generateCode();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + APP_CONFIG.otp.ttlMinutes * 60_000);

    const challenge: OtpChallenge = {
      id: uuid(),
      targetEmail,
      code,
      purpose,
      refId,
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      attemptsUsed: 0,
      maxAttempts: APP_CONFIG.otp.maxAttempts,
      verified: false,
    };
    await this.repo.create(challenge);

    if (APP_CONFIG.emailjs.isConfigured) {
      try {
        await emailjs.send(
          APP_CONFIG.emailjs.serviceId,
          APP_CONFIG.emailjs.templateId,
          {
            to_email: targetEmail,
            otp_code: code,
            ttl_minutes: APP_CONFIG.otp.ttlMinutes,
            clinic_name: APP_CONFIG.clinic.nameAr,
          },
          { publicKey: APP_CONFIG.emailjs.publicKey }
        );
        this.notify.success('تم إرسال رمز التحقق', `أرسلنا رمزًا مكونًا من 6 أرقام إلى ${targetEmail}`);
        return { challengeId: challenge.id, expiresAt: challenge.expiresAt };
      } catch (err) {
        console.error('EmailJS send failed, falling back to demo mode', err);
        this.notify.warn('تعذر إرسال البريد', 'تم عرض رمز التحقق على الشاشة (وضع تجريبي)');
        return { challengeId: challenge.id, expiresAt: challenge.expiresAt, demoCode: code };
      }
    }

    // Demo mode: EmailJS isn't configured, surface the code directly.
    this.notify.info('وضع تجريبي — رمز التحقق', `الرمز: ${code} (صالح لمدة ${APP_CONFIG.otp.ttlMinutes} دقائق)`, 10000);
    return { challengeId: challenge.id, expiresAt: challenge.expiresAt, demoCode: code };
  }

  async verifyOtp(challengeId: Id, enteredCode: string): Promise<OtpVerifyResult> {
    const challenge = await this.repo.get(challengeId);
    if (!challenge) return { ok: false, reason: 'not-found' };
    if (challenge.verified) return { ok: true };

    if (new Date(challenge.expiresAt).getTime() < Date.now()) {
      return { ok: false, reason: 'expired' };
    }
    if (challenge.attemptsUsed >= challenge.maxAttempts) {
      return { ok: false, reason: 'max-attempts' };
    }

    if (challenge.code !== enteredCode.trim()) {
      await this.repo.update(challengeId, { attemptsUsed: challenge.attemptsUsed + 1 });
      const remaining = challenge.maxAttempts - (challenge.attemptsUsed + 1);
      if (remaining <= 0) return { ok: false, reason: 'max-attempts' };
      return { ok: false, reason: 'invalid-code' };
    }

    await this.repo.update(challengeId, { verified: true });
    return { ok: true };
  }

  async getChallenge(id: Id) {
    return this.repo.get(id);
  }

  private generateCode(): string {
    const min = 10 ** (APP_CONFIG.otp.length - 1);
    const max = 10 ** APP_CONFIG.otp.length - 1;
    return String(Math.floor(min + Math.random() * (max - min + 1)));
  }
}
