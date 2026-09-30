import { AuditFields, Id } from './common.model';

export interface Specialty extends AuditFields {
  id: Id;
  nameAr: string;
  nameEn: string;
  icon: string; // bootstrap-icons class
  description?: string;
  active: boolean;
}
