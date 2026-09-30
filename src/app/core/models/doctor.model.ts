import { AuditFields, Gender, Id, WeeklyShift } from './common.model';

export interface Doctor extends AuditFields {
  id: Id;
  fullName: string;
  gender: Gender;
  specialtyId: Id;
  title: string; // e.g. "استشاري", "أخصائي"
  bio?: string;
  avatarColor: string; // used to render an initials avatar
  consultationFee: number;
  rating: number; // 0-5
  ratingCount: number;
  yearsExperience: number;
  shifts: WeeklyShift[];
  active: boolean;
}
