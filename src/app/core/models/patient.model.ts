import { AuditFields, Gender, Id } from './common.model';

export interface VitalSigns {
  recordedAt: string;
  bloodPressure?: string; // "120/80"
  bloodSugar?: number;    // mg/dL
  pulse?: number;         // bpm
  temperature?: number;   // C
  weight?: number;        // kg
  height?: number;        // cm
}

export interface AttachmentFile {
  id: Id;
  name: string;
  mimeType: string;
  base64: string;
  uploadedAt: string;
}

export interface MedicalHistoryEntry {
  chronicDiseases?: string;
  allergies?: string;
  currentMedications?: string;
  previousSurgeries?: string;
  notes?: string;
  attachments: AttachmentFile[];
}

export interface Patient extends AuditFields {
  id: Id;
  fullName: string;
  phone: string;
  email: string;
  gender: Gender;
  dateOfBirth?: string;
  address?: string;
  medicalHistory: MedicalHistoryEntry;
  vitals: VitalSigns[];
}
