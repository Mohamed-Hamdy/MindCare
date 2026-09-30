import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { v4 as uuid } from 'uuid';
import { LanguageService } from '../../../../core/services/language.service';
import { AppointmentRepository } from '../../../../core/data/appointment.repository';
import { PatientRepository } from '../../../../core/data/patient.repository';
import { DoctorRepository } from '../../../../core/data/doctor.repository';
import { MedicineRepository } from '../../../../core/data/medicine.repository';
import { PrescriptionRepository } from '../../../../core/data/prescription.repository';
import { LabTestTypeRepository } from '../../../../core/data/lab-test-type.repository';
import { LabOrderRepository } from '../../../../core/data/lab-order.repository';
import { PdfService } from '../../../../core/services/pdf.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { APP_CONFIG } from '../../../../core/config/app-config';
import {
  Appointment,
  Doctor,
  LabOrder,
  LabTestType,
  Medicine,
  Patient,
  Prescription,
  PrescriptionItem,
  VitalSigns,
} from '../../../../core/models';

@Component({
  selector: 'app-patient-record',
  standalone: true,
  imports: [FormsModule, DatePipe, TranslatePipe],
  templateUrl: './patient-record.html',
})
export class PatientRecord implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private appointmentRepo = inject(AppointmentRepository);
  private patientRepo = inject(PatientRepository);
  private doctorRepo = inject(DoctorRepository);
  private medicineRepo = inject(MedicineRepository);
  private prescriptionRepo = inject(PrescriptionRepository);
  private labTestTypeRepo = inject(LabTestTypeRepository);
  private labOrderRepo = inject(LabOrderRepository);
  private pdfService = inject(PdfService);
  private notify = inject(NotificationService);
  private translate = inject(TranslateService);
  protected lang = inject(LanguageService);

  @ViewChild('printable') printableRef?: ElementRef<HTMLElement>;

  appointment = signal<Appointment | null>(null);
  patient = signal<Patient | null>(null);
  doctor = signal<Doctor | null>(null);
  medicines = signal<Medicine[]>([]);
  labTestTypes = signal<LabTestType[]>([]);
  labOrders = signal<LabOrder[]>([]);

  clinicName = APP_CONFIG.clinic.nameAr;
  clinicPhone = APP_CONFIG.clinic.phone;
  clinicAddress = APP_CONFIG.clinic.address;
  qrDataUrl = signal<string>('');

  // vitals form
  vBloodPressure = '';
  vBloodSugar?: number;
  vPulse?: number;
  vTemperature?: number;
  vWeight?: number;
  vHeight?: number;

  // prescription
  diagnosis = '';
  generalNotes = '';
  items = signal<PrescriptionItem[]>([]);
  selectedMedicineId = '';
  dosage = '';
  durationDays = 5;
  quantity = 1;
  savingPrescription = signal(false);
  exportingPdf = signal(false);

  // lab
  selectedLabTestId = '';

  async ngOnInit(): Promise<void> {
    const appointmentId = this.route.snapshot.paramMap.get('appointmentId')!;
    const appt = await this.appointmentRepo.getById(appointmentId);
    if (!appt) return;
    this.appointment.set(appt);

    const [patient, doctor, medicines, labTestTypes, labOrders, existingRx] = await Promise.all([
      this.patientRepo.getById(appt.patientId),
      this.doctorRepo.getById(appt.doctorId),
      this.medicineRepo.getAll(),
      this.labTestTypeRepo.getAll(),
      this.labOrderRepo.getAll(),
      this.prescriptionRepo.byAppointment(appt.id),
    ]);

    this.patient.set(patient ?? null);
    this.doctor.set(doctor ?? null);
    this.medicines.set(medicines.filter((m) => m.active));
    this.labTestTypes.set(labTestTypes.filter((t) => t.active));
    this.labOrders.set(labOrders.filter((o) => o.appointmentId === appt.id));

    if (existingRx) {
      this.diagnosis = existingRx.diagnosis ?? '';
      this.generalNotes = existingRx.generalNotes ?? '';
      this.items.set(existingRx.items);
    }

    if (this.labTestTypes().length) this.selectedLabTestId = this.labTestTypes()[0].id;
    if (this.medicines().length) this.selectedMedicineId = this.medicines()[0].id;

    this.qrDataUrl.set(await this.pdfService.generateQrDataUrl(`CAREPOINT-RX-${appt.id}`));
  }

  ngAfterViewInit(): void {}

  async addVitals(): Promise<void> {
    const p = this.patient();
    if (!p) return;
    const entry: VitalSigns = {
      recordedAt: new Date().toISOString(),
      bloodPressure: this.vBloodPressure || undefined,
      bloodSugar: this.vBloodSugar,
      pulse: this.vPulse,
      temperature: this.vTemperature,
      weight: this.vWeight,
      height: this.vHeight,
    };
    const updated = await this.patientRepo.update(p.id, { vitals: [...p.vitals, entry] } as any);
    if (updated) this.patient.set(updated);
    this.vBloodPressure = '';
    this.vBloodSugar = this.vPulse = this.vTemperature = this.vWeight = this.vHeight = undefined;
    this.notify.success(this.translate.instant('record.savedVitals'));
  }

  addMedicineRow(): void {
    const med = this.medicines().find((m) => m.id === this.selectedMedicineId);
    if (!med || !this.dosage) {
      this.notify.warn(this.translate.instant('booking.missingFields'), this.translate.instant('record.missingMedicineDosage'));
      return;
    }
    this.items.update((list) => [
      ...list,
      {
        medicineId: med.id,
        medicineName: med.name,
        dosage: this.dosage,
        durationDays: this.durationDays,
        quantity: this.quantity,
      },
    ]);
    this.dosage = '';
    this.durationDays = 5;
    this.quantity = 1;
  }

  removeItem(index: number): void {
    this.items.update((list) => list.filter((_, i) => i !== index));
  }

  async savePrescription(): Promise<void> {
    const appt = this.appointment();
    if (!appt) return;
    this.savingPrescription.set(true);
    try {
      const existing = await this.prescriptionRepo.byAppointment(appt.id);
      const payload: Prescription = {
        id: existing?.id ?? uuid(),
        appointmentId: appt.id,
        patientId: appt.patientId,
        doctorId: appt.doctorId,
        items: this.items(),
        diagnosis: this.diagnosis,
        generalNotes: this.generalNotes,
        dispensed: existing?.dispensed ?? false,
        dispensedAt: existing?.dispensedAt,
        createdAt: existing?.createdAt ?? '',
        updatedAt: '',
      };
      await this.prescriptionRepo.create(payload);
      this.notify.success(this.translate.instant('record.savedPrescription'), this.translate.instant('record.dispensableNote'));
    } finally {
      this.savingPrescription.set(false);
    }
  }

  async orderLabTest(): Promise<void> {
    const appt = this.appointment();
    const test = this.labTestTypes().find((t) => t.id === this.selectedLabTestId);
    if (!appt || !test) return;
    const order = await this.labOrderRepo.create({
      id: uuid(),
      appointmentId: appt.id,
      patientId: appt.patientId,
      doctorId: appt.doctorId,
      testTypeId: test.id,
      testName: test.name,
      status: 'ordered',
      createdAt: '',
      updatedAt: '',
    } as any);
    this.labOrders.update((list) => [...list, order]);
    this.notify.success(this.translate.instant('record.labOrdered'), test.name);
  }

  async exportPrescriptionPdf(): Promise<void> {
    if (!this.printableRef) return;
    this.exportingPdf.set(true);
    try {
      await this.savePrescription();
      const patientName = this.patient()?.fullName ?? 'patient';
      await this.pdfService.exportNodeToPdf(this.printableRef.nativeElement, `prescription-${patientName}.pdf`);
      this.notify.success(this.translate.instant('record.pdfReady'));
    } finally {
      this.exportingPdf.set(false);
    }
  }

  async finishExam(): Promise<void> {
    const appt = this.appointment();
    if (!appt) return;
    const updated = await this.appointmentRepo.update(appt.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    } as any);
    if (updated) this.appointment.set(updated);
    this.notify.success(this.translate.instant('record.examFinished'));
    this.router.navigate(['/doctor']);
  }

  age(dob?: string): string {
    if (!dob) return '—';
    const diff = Date.now() - new Date(dob).getTime();
    const years = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
    return this.lang.lang() === 'ar' ? `${years} سنة` : `${years} yrs`;
  }

  today(): string {
    return new Date().toLocaleDateString(this.lang.lang() === 'ar' ? 'ar-EG' : 'en-US');
  }

  labStatusKey(status: LabOrder['status']): string {
    const map: Record<LabOrder['status'], string> = {
      ordered: 'lab.statusOrdered',
      'sample-collected': 'lab.statusSampleCollected',
      processing: 'lab.statusProcessing',
      ready: 'lab.statusReady',
      delivered: 'lab.statusDelivered',
    };
    return map[status];
  }
}
