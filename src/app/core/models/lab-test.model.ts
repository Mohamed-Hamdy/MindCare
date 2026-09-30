import { AuditFields, Id } from './common.model';

export interface LabTestType extends AuditFields {
  id: Id;
  name: string;
  price: number;
  turnaroundHours: number;
  active: boolean;
}

export type LabOrderStatus = 'ordered' | 'sample-collected' | 'processing' | 'ready' | 'delivered';

export interface LabOrder extends AuditFields {
  id: Id;
  appointmentId: Id;
  patientId: Id;
  doctorId: Id;
  testTypeId: Id;
  testName: string;
  status: LabOrderStatus;
  resultNote?: string;
  resultFileBase64?: string;
  readyAt?: string;
  notifiedAt?: string;
}
