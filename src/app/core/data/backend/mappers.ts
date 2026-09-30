import { AppUser, Appointment, AppointmentStatus, Doctor, Gender, Patient, Specialty, UserRole, WeeklyShift } from '../../models';
import {
  AppointmentDto,
  AppointmentRequestDto,
  BackendAppointmentStatus,
  DoctorDto,
  DoctorRequestDto,
  PatientDto,
  PatientRequestDto,
  ShiftDto,
  SpecialtyDto,
  SpecialtyRequestDto,
  UserDto,
} from './dto.types';

const now = () => new Date().toISOString();

// ---------- Gender ----------

export function genderToBackend(g: Gender): 'MALE' | 'FEMALE' {
  return g === 'female' ? 'FEMALE' : 'MALE';
}

export function genderFromBackend(g: string): Gender {
  return g === 'FEMALE' ? 'female' : 'male';
}

// ---------- Time ("HH:mm" <-> "HH:mm:ss") ----------

/** The backend always serializes LocalTime with seconds; the frontend never uses them. */
export function timeFromBackend(t: string): string {
  return t.length >= 5 ? t.slice(0, 5) : t;
}

/** Jackson's LocalTime deserializer accepts "HH:mm" directly, so no padding is needed to send. */
export function timeToBackend(t: string): string {
  return t;
}

// ---------- Appointment status ----------

const STATUS_TO_BACKEND: Record<AppointmentStatus, BackendAppointmentStatus> = {
  'pending-otp': 'PENDING_OTP',
  confirmed: 'CONFIRMED',
  waiting: 'WAITING',
  'in-exam': 'IN_EXAM',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
  emergency: 'EMERGENCY',
};

const STATUS_FROM_BACKEND: Record<BackendAppointmentStatus, AppointmentStatus> = {
  PENDING_OTP: 'pending-otp',
  CONFIRMED: 'confirmed',
  WAITING: 'waiting',
  IN_EXAM: 'in-exam',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EMERGENCY: 'emergency',
};

export function statusToBackend(s: AppointmentStatus): BackendAppointmentStatus {
  return STATUS_TO_BACKEND[s];
}

export function statusFromBackend(s: BackendAppointmentStatus): AppointmentStatus {
  return STATUS_FROM_BACKEND[s] ?? 'confirmed';
}

// ---------- Specialty ----------

export function specialtyFromDto(dto: SpecialtyDto): Specialty {
  return {
    id: dto.id,
    nameAr: dto.nameAr,
    nameEn: dto.nameEn,
    icon: dto.icon,
    description: dto.description ?? undefined,
    active: dto.active,
    createdAt: dto.createdAt ?? now(),
    updatedAt: dto.updatedAt ?? now(),
  };
}

export function specialtyToRequest(s: Pick<Specialty, 'nameAr' | 'nameEn' | 'icon' | 'description' | 'active'>): SpecialtyRequestDto {
  return {
    nameAr: s.nameAr,
    nameEn: s.nameEn,
    icon: s.icon,
    description: s.description ?? null,
    active: s.active,
  };
}

// ---------- Doctor ----------

function shiftFromDto(s: ShiftDto): WeeklyShift {
  return {
    dayOfWeek: s.dayOfWeek,
    startTime: timeFromBackend(s.startTime),
    endTime: timeFromBackend(s.endTime),
    slotDurationMinutes: s.slotDurationMinutes,
  };
}

function shiftToDto(s: WeeklyShift): ShiftDto {
  return {
    dayOfWeek: s.dayOfWeek,
    startTime: timeToBackend(s.startTime),
    endTime: timeToBackend(s.endTime),
    slotDurationMinutes: s.slotDurationMinutes,
  };
}

export function doctorFromDto(dto: DoctorDto): Doctor {
  return {
    id: dto.id,
    fullName: dto.fullName,
    gender: genderFromBackend(dto.gender),
    specialtyId: dto.specialtyId,
    title: dto.title,
    bio: dto.bio ?? undefined,
    avatarColor: dto.avatarColor,
    consultationFee: dto.consultationFee,
    rating: dto.rating,
    ratingCount: dto.ratingCount,
    yearsExperience: dto.yearsExperience,
    shifts: (dto.shifts ?? []).map(shiftFromDto),
    active: dto.active,
    createdAt: now(),
    updatedAt: now(),
  };
}

export function doctorToRequest(
  d: Pick<
    Doctor,
    | 'fullName'
    | 'gender'
    | 'specialtyId'
    | 'title'
    | 'bio'
    | 'avatarColor'
    | 'consultationFee'
    | 'yearsExperience'
    | 'active'
    | 'shifts'
  >
): DoctorRequestDto {
  return {
    fullName: d.fullName,
    gender: genderToBackend(d.gender),
    specialtyId: d.specialtyId,
    title: d.title,
    bio: d.bio ?? null,
    avatarColor: d.avatarColor,
    consultationFee: d.consultationFee,
    yearsExperience: d.yearsExperience,
    active: d.active,
    shifts: (d.shifts ?? []).map(shiftToDto),
  };
}

// ---------- Patient ----------
//
// The backend's `patients` table (V1__init_schema.sql) only covers the core
// demographic + free-text medical-history fields below. It has no tables yet
// for vitals history or file attachments (those remain a client-side-only,
// IndexedDB feature — see backend/README.md's "Known limitations" section).
// So when mapping a backend PatientDto into the frontend's richer `Patient`
// model, `vitals`/`medicalHistory.attachments` are carried over from
// whatever this repository already had in memory for that id (if anything),
// rather than being dropped on every refresh.

export function patientFromDto(dto: PatientDto, existing?: Patient): Patient {
  return {
    id: dto.id,
    fullName: dto.fullName,
    phone: dto.phone,
    email: dto.email,
    gender: genderFromBackend(dto.gender),
    dateOfBirth: dto.dateOfBirth ?? undefined,
    address: dto.address ?? undefined,
    medicalHistory: {
      chronicDiseases: dto.chronicDiseases ?? undefined,
      allergies: dto.allergies ?? undefined,
      currentMedications: dto.currentMedications ?? undefined,
      previousSurgeries: dto.previousSurgeries ?? undefined,
      notes: dto.notes ?? undefined,
      attachments: existing?.medicalHistory?.attachments ?? [],
    },
    vitals: existing?.vitals ?? [],
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
  };
}

export function patientToRequest(
  p: Pick<Patient, 'fullName' | 'phone' | 'email' | 'gender' | 'dateOfBirth' | 'address' | 'medicalHistory'>
): PatientRequestDto {
  return {
    fullName: p.fullName,
    phone: p.phone,
    email: p.email,
    gender: genderToBackend(p.gender),
    dateOfBirth: p.dateOfBirth || null,
    address: p.address ?? null,
    chronicDiseases: p.medicalHistory?.chronicDiseases ?? null,
    allergies: p.medicalHistory?.allergies ?? null,
    currentMedications: p.medicalHistory?.currentMedications ?? null,
    previousSurgeries: p.medicalHistory?.previousSurgeries ?? null,
    notes: p.medicalHistory?.notes ?? null,
  };
}

// ---------- Appointment ----------

export function appointmentFromDto(dto: AppointmentDto, existing?: Appointment): Appointment {
  return {
    id: dto.id,
    patientId: dto.patientId,
    doctorId: dto.doctorId,
    specialtyId: dto.specialtyId,
    date: dto.date,
    startTime: timeFromBackend(dto.startTime),
    endTime: timeFromBackend(dto.endTime),
    status: statusFromBackend(dto.status),
    reasonForVisit: dto.reasonForVisit ?? undefined,
    queueNumber: dto.queueNumber ?? undefined,
    checkedInAt: dto.checkedInAt ?? undefined,
    startedAt: dto.startedAt ?? undefined,
    completedAt: dto.completedAt ?? undefined,
    isEmergency: dto.emergency,
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
  };
}

/**
 * Books via the backend's "smart slot" logic (it derives `endTime`, `status`
 * and `queueNumber` itself from the doctor's shift — see
 * AppointmentService.book() — rather than trusting whatever the client-side
 * booking flow pre-computed for the IndexedDB path).
 */
// ---------- User (auth only — the User repository itself stays IndexedDB-only) ----------

const ROLE_FROM_BACKEND: Record<UserDto['role'], UserRole> = {
  ADMIN: 'admin',
  RECEPTION: 'reception',
  DOCTOR: 'doctor',
  PHARMACY: 'pharmacy',
  LAB: 'lab',
};

/**
 * The backend never returns a password (hashed or otherwise), so `password`
 * is left as an empty placeholder — safe because a backend-mode session never
 * re-checks it locally; every login/restore round-trips through the backend.
 */
export function userFromDto(dto: UserDto): AppUser {
  return {
    id: dto.id,
    fullName: dto.fullName,
    username: dto.username,
    password: '',
    role: ROLE_FROM_BACKEND[dto.role],
    linkedDoctorId: dto.linkedDoctorId ?? undefined,
    active: dto.active,
    createdAt: now(),
    updatedAt: now(),
  };
}

export function appointmentToBookingRequest(
  a: Pick<Appointment, 'patientId' | 'doctorId' | 'date' | 'startTime' | 'reasonForVisit' | 'isEmergency'>
): AppointmentRequestDto {
  return {
    patientId: a.patientId,
    newPatient: null,
    doctorId: a.doctorId,
    date: a.date,
    startTime: timeToBackend(a.startTime),
    reasonForVisit: a.reasonForVisit ?? null,
    emergency: a.isEmergency,
  };
}
