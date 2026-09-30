import { Injectable } from '@angular/core';
import { getDb } from './db';
import { Id, OtpChallenge } from '../models';

/**
 * OTP challenges are short-lived and never need a reactive list view, so this
 * repository talks to IndexedDB directly instead of extending RepositoryBase.
 */
@Injectable({ providedIn: 'root' })
export class OtpRepository {
  async create(challenge: OtpChallenge): Promise<OtpChallenge> {
    const db = await getDb();
    await db.put('otpChallenges', challenge);
    return challenge;
  }

  async get(id: Id): Promise<OtpChallenge | undefined> {
    const db = await getDb();
    return db.get('otpChallenges', id);
  }

  async update(id: Id, patch: Partial<OtpChallenge>): Promise<OtpChallenge | undefined> {
    const db = await getDb();
    const existing = await db.get('otpChallenges', id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    await db.put('otpChallenges', updated);
    return updated;
  }

  async remove(id: Id): Promise<void> {
    const db = await getDb();
    await db.delete('otpChallenges', id);
  }
}
