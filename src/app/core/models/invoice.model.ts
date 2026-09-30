import { AuditFields, Id, PaymentMethod } from './common.model';

export interface InvoiceLineItem {
  description: string;
  kind: 'consultation' | 'medicine' | 'lab-test' | 'other';
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice extends AuditFields {
  id: Id;
  invoiceNumber: string;
  appointmentId?: Id;
  patientId: Id;
  items: InvoiceLineItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paid: boolean;
  paidAt?: string;
}
