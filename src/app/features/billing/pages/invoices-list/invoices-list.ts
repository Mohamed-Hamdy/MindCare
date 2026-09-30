import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { InvoiceRepository } from '../../../../core/data/invoice.repository';
import { PatientRepository } from '../../../../core/data/patient.repository';
import { Invoice, Patient, PaymentMethod } from '../../../../core/models';

interface Row extends Invoice {
  patientName: string;
}

const PAY_LABEL_KEYS: Record<PaymentMethod, string> = {
  cash: 'billing.payCash',
  card: 'billing.payCard',
  wallet: 'billing.payWallet',
  insurance: 'billing.payInsurance',
};

@Component({
  selector: 'app-invoices-list',
  standalone: true,
  imports: [FormsModule, DecimalPipe, DatePipe, RouterLink, TranslatePipe],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h5 class="cp-fw-800 mb-0"><i class="bi bi-receipt me-2 ms-2"></i>{{ 'billing.listTitle' | translate }}</h5>
      <a routerLink="new" class="btn btn-primary btn-sm"><i class="bi bi-plus-lg me-1 ms-1"></i> {{ 'billing.newInvoiceBtn' | translate }}</a>
    </div>

    <div class="cp-card p-3 mb-3 d-flex flex-wrap gap-2">
      <input
        class="form-control"
        style="max-width: 320px;"
        [placeholder]="'billing.searchPlaceholder' | translate"
        [ngModel]="search()"
        (ngModelChange)="search.set($event)"
      />
      <select
        class="form-select"
        style="max-width: 220px;"
        [ngModel]="paymentMethodFilter()"
        (ngModelChange)="paymentMethodFilter.set($event)"
      >
        <option [ngValue]="null">{{ 'billing.filterPaymentMethod' | translate }}: {{ 'common.all' | translate }}</option>
        <option value="cash">{{ 'billing.payCash' | translate }}</option>
        <option value="card">{{ 'billing.payCard' | translate }}</option>
        <option value="wallet">{{ 'billing.payWallet' | translate }}</option>
        <option value="insurance">{{ 'billing.payInsurance' | translate }}</option>
      </select>
    </div>

    <div class="cp-card p-0">
      <div class="table-responsive">
        <table class="table table-hover mb-0 align-middle">
          <thead>
            <tr>
              <th class="ps-3">{{ 'billing.colInvoiceNumber' | translate }}</th>
              <th>{{ 'billing.colPatient' | translate }}</th>
              <th>{{ 'billing.colTotal' | translate }}</th>
              <th>{{ 'billing.colPaymentMethod' | translate }}</th>
              <th class="pe-3">{{ 'billing.colDate' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (inv of filtered(); track inv.id) {
              <tr>
                <td class="ps-3 fw-semibold">{{ inv.invoiceNumber }}</td>
                <td>{{ inv.patientName }}</td>
                <td class="fw-bold">{{ inv.total | number: '1.2-2' }} {{ 'common.egp' | translate }}</td>
                <td>{{ payLabelKey(inv.paymentMethod) | translate }}</td>
                <td class="pe-3 small cp-text-muted">{{ inv.createdAt | date: 'short' }}</td>
              </tr>
            }
            @if (filtered().length === 0) {
              <tr><td colspan="5" class="text-center cp-text-muted py-4">{{ 'billing.none' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class InvoicesList implements OnInit {
  private invoiceRepo = inject(InvoiceRepository);
  private patientRepo = inject(PatientRepository);

  private invoices = signal<Invoice[]>([]);
  private patients = signal<Patient[]>([]);
  search = signal('');
  paymentMethodFilter = signal<PaymentMethod | null>(null);

  rows = computed<Row[]>(() => {
    const patientsMap = new Map(this.patients().map((p) => [p.id, p]));
    return this.invoices()
      .map((i) => ({ ...i, patientName: patientsMap.get(i.patientId)?.fullName ?? '—' }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  });

  filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const payFilter = this.paymentMethodFilter();
    return this.rows().filter((r) => {
      const matchesTerm = !term || r.invoiceNumber.toLowerCase().includes(term) || r.patientName.toLowerCase().includes(term);
      const matchesPay = !payFilter || r.paymentMethod === payFilter;
      return matchesTerm && matchesPay;
    });
  });

  async ngOnInit(): Promise<void> {
    this.invoices.set(await this.invoiceRepo.getAll());
    this.patients.set(await this.patientRepo.getAll());
  }

  payLabelKey(m: PaymentMethod): string {
    return PAY_LABEL_KEYS[m] ?? m;
  }
}
