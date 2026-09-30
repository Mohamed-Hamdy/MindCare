import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DoctorRepository } from '../../../../core/data/doctor.repository';
import { PatientRepository } from '../../../../core/data/patient.repository';
import { AppointmentRepository } from '../../../../core/data/appointment.repository';
import { MedicineRepository } from '../../../../core/data/medicine.repository';
import { InvoiceRepository } from '../../../../core/data/invoice.repository';
import { LabOrderRepository } from '../../../../core/data/lab-order.repository';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <h5 class="cp-fw-800 mb-4"><i class="bi bi-speedometer2 me-2 ms-2"></i>{{ 'admin.dashboardTitle' | translate }}</h5>

    <div class="row g-3 mb-4">
      @for (kpi of kpis(); track kpi.labelKey) {
        <div class="col-6 col-lg-3">
          <div class="cp-card p-3 d-flex align-items-center gap-3">
            <span
              class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
              style="width: 46px; height: 46px; font-size: 1.2rem;"
              [style.background]="kpi.bg"
              [style.color]="kpi.color"
            >
              <i class="bi" [class]="kpi.icon"></i>
            </span>
            <div>
              <div class="fs-4 fw-bold">{{ kpi.value }}</div>
              <div class="small cp-text-muted">{{ kpi.labelKey | translate }}</div>
            </div>
          </div>
        </div>
      }
    </div>

    <div class="row g-3">
      <div class="col-md-6">
        <div class="cp-card p-3">
          <h6 class="fw-bold mb-2"><i class="bi bi-exclamation-triangle text-warning me-2 ms-2"></i>{{ 'admin.lowStockAlertTitle' | translate }}</h6>
          @if (lowStockCount() === 0) {
            <div class="small cp-text-muted">{{ 'admin.lowStockNone' | translate }}</div>
          } @else {
            <div class="small">{{ lowStockCount() }} {{ 'admin.lowStockSome' | translate }}</div>
          }
          <a routerLink="/admin/medicines" class="small">{{ 'admin.viewMedicines' | translate }} <i class="bi bi-arrow-left"></i></a>
        </div>
      </div>
      <div class="col-md-6">
        <div class="cp-card p-3">
          <h6 class="fw-bold mb-2"><i class="bi bi-clipboard2-pulse text-info me-2 ms-2"></i>{{ 'admin.pendingLabTitle' | translate }}</h6>
          <div class="small">{{ pendingLabOrders() }} {{ 'admin.pendingLabCount' | translate }}</div>
        </div>
      </div>
    </div>
  `,
})
export class AdminDashboard implements OnInit {
  private doctorRepo = inject(DoctorRepository);
  private patientRepo = inject(PatientRepository);
  private appointmentRepo = inject(AppointmentRepository);
  private medicineRepo = inject(MedicineRepository);
  private invoiceRepo = inject(InvoiceRepository);
  private labOrderRepo = inject(LabOrderRepository);
  private translate = inject(TranslateService);

  kpis = signal<Array<{ labelKey: string; value: string | number; icon: string; bg: string; color: string }>>([]);
  lowStockCount = signal(0);
  pendingLabOrders = signal(0);

  async ngOnInit(): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const [doctors, patients, appointments, medicines, invoices, labOrders] = await Promise.all([
      this.doctorRepo.getAll(),
      this.patientRepo.getAll(),
      this.appointmentRepo.getAll(),
      this.medicineRepo.getAll(),
      this.invoiceRepo.getAll(),
      this.labOrderRepo.getAll(),
    ]);

    const todayAppointments = appointments.filter((a) => a.date === today);
    const todayRevenue = invoices
      .filter((i) => i.createdAt.slice(0, 10) === today)
      .reduce((sum, i) => sum + i.total, 0);
    const lowStock = medicines.filter((m) => m.quantityInStock <= m.minStockThreshold);
    const pendingLab = labOrders.filter((o) => o.status !== 'delivered');

    this.lowStockCount.set(lowStock.length);
    this.pendingLabOrders.set(pendingLab.length);

    const egp = this.translate.instant('common.egp');
    this.kpis.set([
      { labelKey: 'admin.kpiDoctors', value: doctors.length, icon: 'bi-person-badge', bg: 'rgba(15,125,140,.12)', color: 'var(--cp-primary)' },
      { labelKey: 'admin.kpiPatients', value: patients.length, icon: 'bi-people', bg: 'rgba(46,158,91,.12)', color: 'var(--cp-success)' },
      { labelKey: 'admin.kpiTodayAppointments', value: todayAppointments.length, icon: 'bi-calendar2-check', bg: 'rgba(59,130,196,.12)', color: 'var(--cp-info)' },
      { labelKey: 'admin.kpiTodayRevenue', value: todayRevenue.toFixed(0) + ' ' + egp, icon: 'bi-cash-coin', bg: 'rgba(230,164,23,.12)', color: 'var(--cp-warning)' },
    ]);
  }
}
