import { AuditFields, Id } from './common.model';

export type UserRole = 'admin' | 'reception' | 'doctor' | 'pharmacy' | 'lab';

export interface AppUser extends AuditFields {
  id: Id;
  fullName: string;
  username: string;
  password: string; // demo-only plaintext, client-side app has no backend
  role: UserRole;
  linkedDoctorId?: Id;
  active: boolean;
}
