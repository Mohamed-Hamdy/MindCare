import { AuditFields, Id } from './common.model';

export interface Medicine extends AuditFields {
  id: Id;
  name: string;
  form: string;        // "أقراص", "شراب", "حقن"...
  strength?: string;    // "500mg"
  unitPrice: number;
  quantityInStock: number;
  minStockThreshold: number;
  active: boolean;
}

export interface PrescriptionItem {
  medicineId: Id;
  medicineName: string;
  dosage: string;      // "قرص كل 8 ساعات"
  durationDays: number;
  quantity: number;
  notes?: string;
}

export interface Prescription extends AuditFields {
  id: Id;
  appointmentId: Id;
  patientId: Id;
  doctorId: Id;
  items: PrescriptionItem[];
  diagnosis?: string;
  generalNotes?: string;
  dispensed: boolean;
  dispensedAt?: string;
}
