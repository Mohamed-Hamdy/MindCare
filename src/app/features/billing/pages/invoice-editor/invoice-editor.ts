import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { v4 as uuid } from 'uuid';
import { LanguageService } from '../../../../core/services/language.service';
import { AppointmentRepository } from '../../../../core/data/appointment.repository';
import { InvoiceRepository } from '../../../../core/data/invoice.repository';
import { PatientRepository } from '../../../../core/data/patient.repository';
import { DoctorRepository } from '../../../../core/data/doctor.repository';
import { PrescriptionRepository } from '../../../../core/data/prescription.repository';
import { LabOrderRepository } from '../../../../core/data/lab-order.repository';
import { MedicineRepository } from '../../../../core/data/medicine.repository';
import { LabTestTypeRepository } from '../../../../core/data/lab-test-type.repository';
import { PdfService } from '../../../../core/services/pdf.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { APP_CONFIG } from '../../../../core/config/app-config';
import { Appointment, Doctor, Invoice, InvoiceLineItem, Patient, PaymentMethod } from '../../../../core/models';

interface ApptOption extends Appointment {
  patientName: string;
  doctorName: string;
}

@Component({
  selector: 'app-invoice-editor',
  standalone: true,
  imports: [FormsModule, DecimalPipe, TranslatePipe],
  templateUrl: './invoice-editor.html',
})
export class InvoiceEditor implements OnInit {
  private appointmentRepo = inject(AppointmentRepository);
  private invoiceRepo = inject(InvoiceRepository);
  private patientRepo = inject(PatientRepository);
  private doctorRepo = inject(DoctorRepository);
  private prescriptionRepo = inject(PrescriptionRepository);
  private labOrderRepo = inject(LabOrderRepository);
  private medicineRepo = inject(MedicineRepository);
  private labTestTypeRepo = inject(LabTestTypeRepository);
  private pdfService = inject(PdfService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  protected lang = inject(LanguageService);

  @ViewChild('printable') printableRef?: ElementRef<HTMLElement>;

  clinicName = APP_CONFIG.clinic.nameAr;
  clinicPhone = APP_CONFIG.clinic.phone;
  clinicAddress = APP_CONFIG.clinic.address;

  options = signal<ApptOption[]>([]);
  selectedAppointmentId = '';
  selectedPatient = signal<Patient | null>(null);

  items = signal<InvoiceLineItem[]>([]);
  discountPercent = 0;
  taxPercent = 14;
  paymentMethod: PaymentMethod = 'cash';

  manualDescription = '';
  manualPrice = 0;

  saving = signal(false);
  savedInvoice = signal<Invoice | null>(null);
  qrDataUrl = signal('');

  subtotal = computed(() => this.items().reduce((s, i) => s + i.total, 0));
  discountAmount = computed(() => (this.subtotal() * this.discountPercent) / 100);
  taxableAmount = computed(() => this.subtotal() - this.discountAmount());
  taxAmount = computed(() => (this.taxableAmount() * this.taxPercent) / 100);
  total = computed(() => this.taxableAmount() + this.taxAmount());

  async ngOnInit(): Promise<void> {
    const [appts, patients, doctors, invoices] = await Promise.all([
      this.appointmentRepo.getAll(),
      this.patientRepo.getAll(),
      this.doctorRepo.getAll(),
      this.invoiceRepo.getAll(),
    ]);
    const patientsMap = new Map(patients.map((p) => [p.id, p]));
    const doctorsMap = new Map(doctors.map((d) => [d.id, d]));
    const invoicedApptIds = new Set(invoices.map((i) => i.appointmentId).filter(Boolean));

    this.options.set(
      appts
        .filter((a) => (a.status === 'completed' || a.status === 'waiting' || a.status === 'in-exam') && !invoicedApptIds.has(a.id))
        .map((a) => ({
          ...a,
          patientName: patientsMap.get(a.patientId)?.fullName ?? '—',
          doctorName: doctorsMap.get(a.doctorId)?.fullName ?? '—',
        }))
    );
  }

  async loadAppointment(): Promise<void> {
    const appt = this.options().find((o) => o.id === this.selectedAppointmentId);
    if (!appt) return;

    const [patient, doctor, prescription, labOrders] = await Promise.all([
      this.patientRepo.getById(appt.patientId),
      this.doctorRepo.getById(appt.doctorId),
      this.prescriptionRepo.byAppointment(appt.id),
      this.labOrderRepo.getAll(),
    ]);
    this.selectedPatient.set(patient ?? null);

    const [medicines, labTestTypes] = await Promise.all([this.medicineRepo.getAll(), this.labTestTypeRepo.getAll()]);
    const medicinesMap = new Map(medicines.map((m) => [m.id, m]));
    const testTypesMap = new Map(labTestTypes.map((t) => [t.id, t]));

    const lines: InvoiceLineItem[] = [];
    if (doctor) {
      lines.push({
        description: this.translate.instant('billing.consultationLine', { doctor: doctor.fullName }),
        kind: 'consultation',
        quantity: 1,
        unitPrice: doctor.consultationFee,
        total: doctor.consultationFee,
      });
    }
    if (prescription?.dispensed) {
      for (const item of prescription.items) {
        const unitPrice = medicinesMap.get(item.medicineId)?.unitPrice ?? 0;
        lines.push({
          description: this.translate.instant('billing.medicineLine', { name: item.medicineName }),
          kind: 'medicine',
          quantity: item.quantity,
          unitPrice,
          total: unitPrice * item.quantity,
        });
      }
    }
    for (const order of labOrders.filter((o) => o.appointmentId === appt.id)) {
      const unitPrice = testTypesMap.get(order.testTypeId)?.price ?? 0;
      lines.push({
        description: this.translate.instant('billing.labLine', { name: order.testName }),
        kind: 'lab-test',
        quantity: 1,
        unitPrice,
        total: unitPrice,
      });
    }

    this.items.set(lines);
    this.qrDataUrl.set(await this.pdfService.generateQrDataUrl(`CAREPOINT-INV-${appt.id}`));
  }

  addManualItem(): void {
    if (!this.manualDescription || this.manualPrice <= 0) return;
    this.items.update((list) => [
      ...list,
      { description: this.manualDescription, kind: 'other', quantity: 1, unitPrice: this.manualPrice, total: this.manualPrice },
    ]);
    this.manualDescription = '';
    this.manualPrice = 0;
  }

  removeItem(i: number): void {
    this.items.update((list) => list.filter((_, idx) => idx !== i));
  }

  async saveInvoice(): Promise<void> {
    const patient = this.selectedPatient();
    if (!patient || this.items().length === 0) {
      this.notify.warn(this.translate.instant('billing.missingData'), this.translate.instant('billing.missingDataMsg'));
      return;
    }
    this.saving.set(true);
    try {
      const invoiceNumber = await this.invoiceRepo.nextInvoiceNumber();
      const invoice = await this.invoiceRepo.create({
        id: uuid(),
        invoiceNumber,
        appointmentId: this.selectedAppointmentId,
        patientId: patient.id,
        items: this.items(),
        subtotal: this.subtotal(),
        discountPercent: this.discountPercent,
        discountAmount: this.discountAmount(),
        taxPercent: this.taxPercent,
        taxAmount: this.taxAmount(),
        total: this.total(),
        paymentMethod: this.paymentMethod,
        paid: true,
        paidAt: new Date().toISOString(),
        createdAt: '',
        updatedAt: '',
      } as any);
      this.savedInvoice.set(invoice);
      this.notify.success(this.translate.instant('billing.issued'), invoiceNumber);
    } finally {
      this.saving.set(false);
    }
  }

  async exportPdf(): Promise<void> {
    if (!this.printableRef) return;
    const name = this.selectedPatient()?.fullName ?? 'invoice';
    await this.pdfService.exportNodeToPdf(this.printableRef.nativeElement, `invoice-${name}.pdf`);
  }

  resetForNew(): void {
    this.savedInvoice.set(null);
    this.selectedAppointmentId = '';
    this.selectedPatient.set(null);
    this.items.set([]);
    this.router.navigate(['/reception/invoices']);
  }

  today(): string {
    return new Date().toLocaleDateString(this.lang.lang() === 'ar' ? 'ar-EG' : 'en-US');
  }

  paymentLabelKey(): string {
    const map: Record<PaymentMethod, string> = {
      cash: 'billing.payCash',
      card: 'billing.payCard',
      wallet: 'billing.payWallet',
      insurance: 'billing.payInsurance',
    };
    return map[this.paymentMethod];
  }
}
