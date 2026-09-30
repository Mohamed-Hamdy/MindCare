/**
 * TypeScript mirrors of the Spring Boot backend's JSON DTOs
 * (backend/src/main/java/com/mindcare/backend/dto/**). Field names match the
 * Java record component names exactly, since Jackson serializes records
 * as-is (camelCase both sides). Kept separate from the frontend's own
 * `core/models` so the two can drift without fighting each other — mapping
 * between them happens explicitly in `mappers.ts`.
 */

export interface SpecialtyDto {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  description?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SpecialtyRequestDto {
  nameAr: string;
  nameEn: string;
  icon: string;
  description?: string | null;
  active: boolean;
}

export interface ShiftDto {
  dayOfWeek: number;
  startTime: string; // "HH:mm:ss" from the backend, "HH:mm" accepted when sent
  endTime: string;
  slotDurationMinutes: number;
}

export interface DoctorDto {
  id: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE';
  specialtyId: string;
  specialtyNameEn: string;
  specialtyNameAr: string;
  title: string;
  bio?: string | null;
  avatarColor: string;
  consultationFee: number;
  rating: number;
  ratingCount: number;
  yearsExperience: number;
  active: boolean;
  shifts: ShiftDto[];
}

export interface DoctorRequestDto {
  fullName: string;
  gender: 'MALE' | 'FEMALE';
  specialtyId: string;
  title: string;
  bio?: string | null;
  avatarColor: string;
  consultationFee: number;
  yearsExperience: number;
  active: boolean;
  shifts: ShiftDto[];
}

export interface PatientDto {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  gender: 'MALE' | 'FEMALE';
  dateOfBirth?: string | null;
  address?: string | null;
  chronicDiseases?: string | null;
  allergies?: string | null;
  currentMedications?: string | null;
  previousSurgeries?: string | null;
  notes?: string | null;
}

export interface PatientRequestDto {
  fullName: string;
  phone: string;
  email: string;
  gender: 'MALE' | 'FEMALE';
  dateOfBirth?: string | null;
  address?: string | null;
  chronicDiseases?: string | null;
  allergies?: string | null;
  currentMedications?: string | null;
  previousSurgeries?: string | null;
  notes?: string | null;
}

export type BackendAppointmentStatus =
  | 'PENDING_OTP'
  | 'CONFIRMED'
  | 'WAITING'
  | 'IN_EXAM'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EMERGENCY';

export interface AppointmentDto {
  id: string;
  patientId: string;
  patientFullName: string;
  doctorId: string;
  doctorFullName: string;
  specialtyId: string;
  date: string; // "yyyy-MM-dd"
  startTime: string; // "HH:mm:ss"
  endTime: string;
  status: BackendAppointmentStatus;
  reasonForVisit?: string | null;
  queueNumber?: number | null;
  checkedInAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  emergency: boolean;
}

export interface AppointmentRequestDto {
  patientId?: string | null;
  newPatient?: {
    fullName: string;
    phone: string;
    email: string;
    gender: 'MALE' | 'FEMALE';
  } | null;
  doctorId: string;
  date: string;
  startTime: string;
  reasonForVisit?: string | null;
  emergency: boolean;
}

export interface AppointmentStatusUpdateRequestDto {
  status: BackendAppointmentStatus;
}

export interface UserDto {
  id: string;
  fullName: string;
  username: string;
  role: 'ADMIN' | 'RECEPTION' | 'DOCTOR' | 'PHARMACY' | 'LAB';
  linkedDoctorId?: string | null;
  active: boolean;
}

export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface LoginResponseDto {
  token: string;
  tokenType: string;
  user: UserDto;
}
