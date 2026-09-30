/** Shared primitive types used across the MindCare domain. */

export type Id = string;

export type Gender = 'male' | 'female';

export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'insurance';

export interface AuditFields {
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyShift {
  /** 0 = Sunday .. 6 = Saturday */
  dayOfWeek: number;
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  slotDurationMinutes: number;
}
