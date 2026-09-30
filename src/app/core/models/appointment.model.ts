import { AuditFields, Id } from './common.model';

export type AppointmentStatus =
  | 'pending-otp'
  | 'confirmed'
  | 'waiting'
  | 'in-exam'
  | 'completed'
  | 'cancelled'
  | 'emergency';

export interface Appointment extends AuditFields {
  id: Id;
  patientId: Id;
  doctorId: Id;
  specialtyId: Id;
  date: string;       // "2026-09-21"
  startTime: string;  // "09:30"
  endTime: string;    // "09:45"
  status: AppointmentStatus;
  reasonForVisit?: string;
  queueNumber?: number;
  checkedInAt?: string;
  startedAt?: string;
  completedAt?: string;
  isEmergency: boolean;
}
