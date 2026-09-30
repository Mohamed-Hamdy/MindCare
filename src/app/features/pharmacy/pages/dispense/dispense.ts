import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PrescriptionRepository } from '../../../../core/data/prescription.repository';
import { PatientRepository } from '../../../../core/data/patient.repository';
import { MedicineRepository } from '../../../../core/data/medicine.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { Medicine, Patient, Prescription } from '../../../../core/models';

interface Row extends Prescription {
  patientName: string;
  canDispense: boolean;
  shortage: string[];
}

@Component({
  selector: 'app-pharmacy-dispense',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h5 class="cp-fw-800 mb-0"><i class="bi bi-prescription2 me-2 ms-2"></i>{{ 'pharmacy.dispenseTitle' | translate }}</h5>
      <div class="form-check">
        <input
          class="form-check-input"
          type="checkbox"
          id="canDispenseOnly"
          [ngModel]="canDispenseOnly()"
          (ngModelChange)="canDispenseOnly.set($event)"
        />
        <label class="form-check-label small" for="canDispenseOnly">{{ 'pharmacy.filterCanDispense' | translate }}</label>
      </div>
    </div>

    @if (filteredRows().length === 0) {
      <div class="cp-card p-5 text-center cp-text-muted">{{ 'pharmacy.noneToDispense' | translate }}</div>
    }

    <div class="d-flex flex-column gap-3">
      @for (r of filteredRows(); track r.id) {
        <div class="cp-card p-3">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
            <div>
              <div class="fw-bold">{{ r.patientName }}</div>
              <div class="small cp-text-muted">{{ r.diagnosis || ('pharmacy.noDiagnosis' | translate) }}</div>
            </div>
            <button class="btn btn-sm btn-primary" [disabled]="!r.canDispense" (click)="dispense(r)">
              <i class="bi bi-check2-circle me-1 ms-1"></i> {{ 'pharmacy.dispense' | translate }}
            </button>
          </div>
          <div class="table-responsive">
            <table class="table table-sm mb-0">
              <thead>
                <tr>
                  <th>{{ 'record.medicine' | translate }}</th>
                  <th>{{ 'record.dosage' | translate }}</th>
                  <th>{{ 'record.quantity' | translate }}</th>
                  <th>{{ 'pharmacy.colAvailable' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (item of r.items; track item.medicineId) {
                  <tr [class.table-danger]="isShort(item.medicineId, item.quantity)">
                    <td class="small">{{ item.medicineName }}</td>
                    <td class="small">{{ item.dosage }}</td>
                    <td class="small">{{ item.quantity }}</td>
                    <td class="small">{{ stockOf(item.medicineId) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (!r.canDispense) {
            <div class="alert alert-danger py-1 px-2 small mb-0 mt-2">
              {{ 'pharmacy.shortageMessage' | translate: { items: r.shortage.join('، ') } }}
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class PharmacyDispense implements OnInit {
  private prescriptionRepo = inject(PrescriptionRepository);
  private patientRepo = inject(PatientRepository);
  private medicineRepo = inject(MedicineRepository);
  private notify = inject(NotificationService);
  private translate = inject(TranslateService);

  private prescriptions = signal<Prescription[]>([]);
  private patients = signal<Patient[]>([]);
  medicines = signal<Medicine[]>([]);
  canDispenseOnly = signal(false);

  rows = computed<Row[]>(() => {
    const patientsMap = new Map(this.patients().map((p) => [p.id, p]));
    return this.prescriptions()
      .filter((p) => !p.dispensed && p.items.length > 0)
      .map((p) => {
        const shortage = p.items
          .filter((i) => this.stockOf(i.medicineId) < i.quantity)
          .map((i) => i.medicineName);
        return {
          ...p,
          patientName: patientsMap.get(p.patientId)?.fullName ?? '—',
          canDispense: shortage.length === 0,
          shortage,
        };
      });
  });

  filteredRows = computed(() => {
    const canDispenseOnly = this.canDispenseOnly();
    const all = this.rows();
    return canDispenseOnly ? all.filter((r) => r.canDispense) : all;
  });

  async ngOnInit(): Promise<void> {
    this.prescriptions.set(await this.prescriptionRepo.getAll());
    this.patients.set(await this.patientRepo.getAll());
    this.medicines.set(await this.medicineRepo.getAll());
  }

  stockOf(medicineId: string): number {
    return this.medicines().find((m) => m.id === medicineId)?.quantityInStock ?? 0;
  }

  isShort(medicineId: string, qty: number): boolean {
    return this.stockOf(medicineId) < qty;
  }

  async dispense(r: Row): Promise<void> {
    for (const item of r.items) {
      await this.medicineRepo.deductStock(item.medicineId, item.quantity);
    }
    await this.prescriptionRepo.update(r.id, { dispensed: true, dispensedAt: new Date().toISOString() } as any);
    this.prescriptions.set(await this.prescriptionRepo.getAll());
    this.medicines.set(await this.medicineRepo.getAll());
    this.notify.success(this.translate.instant('pharmacy.dispensed'), r.patientName);
  }
}
