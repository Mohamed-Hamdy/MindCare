import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MedicineRepository } from '../../../../core/data/medicine.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { Medicine } from '../../../../core/models';

@Component({
  selector: 'app-pharmacy-inventory',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h5 class="cp-fw-800 mb-0"><i class="bi bi-capsule me-2 ms-2"></i>{{ 'pharmacy.inventoryTitle' | translate }}</h5>
      <input
        class="form-control"
        style="max-width: 260px;"
        [placeholder]="'pharmacy.searchPlaceholder' | translate"
        [ngModel]="search()"
        (ngModelChange)="search.set($event)"
      />
    </div>

    <div class="d-flex align-items-center gap-2 mb-3">
      <div class="form-check">
        <input
          class="form-check-input"
          type="checkbox"
          id="lowStockOnly"
          [ngModel]="lowStockOnly()"
          (ngModelChange)="lowStockOnly.set($event)"
        />
        <label class="form-check-label small" for="lowStockOnly">{{ 'pharmacy.filterLowStock' | translate }}</label>
      </div>
    </div>

    @if (lowStock().length > 0) {
      <div class="alert alert-warning d-flex align-items-center gap-2">
        <i class="bi bi-exclamation-triangle-fill"></i>
        <span>{{ lowStock().length }} {{ 'pharmacy.lowStockAlert' | translate }}: {{ lowStockNames() }}</span>
      </div>
    }

    <div class="cp-card p-0">
      <div class="table-responsive">
        <table class="table table-hover mb-0 align-middle">
          <thead>
            <tr>
              <th class="ps-3">{{ 'pharmacy.colName' | translate }}</th>
              <th>{{ 'pharmacy.colForm' | translate }}</th>
              <th>{{ 'pharmacy.colPrice' | translate }}</th>
              <th>{{ 'pharmacy.colStock' | translate }}</th>
              <th>{{ 'pharmacy.colMinStock' | translate }}</th>
              <th class="pe-3">{{ 'common.actions' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (m of filtered(); track m.id) {
              <tr [class.table-warning]="m.quantityInStock <= m.minStockThreshold">
                <td class="ps-3 fw-semibold">{{ m.name }} <span class="cp-text-muted small">{{ m.strength }}</span></td>
                <td>{{ m.form }}</td>
                <td>{{ m.unitPrice }} {{ 'common.egp' | translate }}</td>
                <td class="fw-bold">{{ m.quantityInStock }}</td>
                <td>{{ m.minStockThreshold }}</td>
                <td class="pe-3">
                  <div class="input-group input-group-sm" style="width: 160px;">
                    <input
                      type="number"
                      class="form-control"
                      [placeholder]="'pharmacy.restockPlaceholder' | translate"
                      [(ngModel)]="restockQty[m.id]"
                    />
                    <button class="btn btn-outline-primary" (click)="restock(m)"><i class="bi bi-plus-lg"></i></button>
                  </div>
                </td>
              </tr>
            }
            @if (filtered().length === 0) {
              <tr><td colspan="6" class="text-center cp-text-muted small py-4">{{ 'common.noResults' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class PharmacyInventory implements OnInit {
  private medicineRepo = inject(MedicineRepository);
  private notify = inject(NotificationService);
  private translate = inject(TranslateService);

  medicines = signal<Medicine[]>([]);
  search = signal('');
  lowStockOnly = signal(false);
  restockQty: Record<string, number> = {};

  filtered = computed(() => {
    const search = this.search();
    const lowStockOnly = this.lowStockOnly();
    return this.medicines().filter(
      (m) => (!search || m.name.includes(search)) && (!lowStockOnly || m.quantityInStock <= m.minStockThreshold)
    );
  });

  lowStock = computed(() => this.medicines().filter((m) => m.quantityInStock <= m.minStockThreshold));
  lowStockNames = computed(() => this.lowStock().map((m) => m.name).join('، '));

  async ngOnInit(): Promise<void> {
    this.medicines.set(await this.medicineRepo.getAll());
  }

  async restock(m: Medicine): Promise<void> {
    const qty = Number(this.restockQty[m.id] || 0);
    if (qty <= 0) return;
    const updated = await this.medicineRepo.update(m.id, { quantityInStock: m.quantityInStock + qty } as any);
    this.medicines.set(await this.medicineRepo.getAll());
    this.restockQty[m.id] = 0;
    this.notify.success(this.translate.instant('pharmacy.restocked'), `${m.name}: +${qty}`);
  }
}
