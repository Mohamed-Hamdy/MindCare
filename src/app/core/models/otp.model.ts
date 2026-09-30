import { Id } from './common.model';

export interface OtpChallenge {
  id: Id;
  targetEmail: string;
  code: string;
  purpose: 'booking-confirmation' | 'login';
  refId?: Id; // e.g. appointment id
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  attemptsUsed: number;
  maxAttempts: number;
  verified: boolean;
}
