import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { v4 as uuid } from 'uuid';
import { DoctorRepository } from '../../../../core/data/doctor.repository';
import { SpecialtyRepository } from '../../../../core/data/specialty.repository';
import { UserRepository } from '../../../../core/data/user.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { RatingStars } from '../../../../shared/components/rating-stars/rating-stars';
import { LanguageService } from '../../../../core/services/language.service';
import { Doctor, Specialty } from '../../../../core/models';

type DoctorForm = Omit<Doctor, 'createdAt' | 'updatedAt' | 'shifts'>;

const EMPTY: DoctorForm = {
  id: '',
  fullName: '',
  gender: 'male',
  specialtyId: '',
  title: 'أخصائي',
  bio: '',
  avatarColor: '#0f7d8c',
  consultationFee: 200,
  rating: 5,
  ratingCount: 0,
  yearsExperience: 1,
  active: true,
};

const COLORS = ['#0f7d8c', '#2a9d8f', '#3b82c4', '#8a5cf5', '#e6a417', '#d64545'];

@Component({
  selector: 'app-admin-doctors',
  standalone: true,
  imports: [FormsModule, RatingStars, TranslatePipe],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h5 class="cp-fw-800 mb-0"><i class="bi bi-person-badge me-2 ms-2"></i>{{ 'admin.doctorsTitle' | translate }}</h5>
      <button class="btn btn-primary btn-sm" (click)="openNew()"><i class="bi bi-plus-lg me-1 ms-1"></i> {{ 'admin.newDoctor' | translate }}</button>
    </div>

    <div class="cp-card p-3 mb-3 d-flex flex-wrap gap-2">
      <input
        class="form-control"
        style="max-width: 260px;"
        [placeholder]="'common.searchPlaceholder' | translate"
        [ngModel]="search()"
        (ngModelChange)="search.set($event)"
      />
      <select
        class="form-select"
        style="max-width: 220px;"
        [ngModel]="specialtyFilter()"
        (ngModelChange)="specialtyFilter.set($event)"
      >
        <option [ngValue]="null">{{ 'admin.colSpecialty' | translate }}: {{ 'common.all' | translate }}</option>
        @for (s of specialties(); track s.id) {
          <option [ngValue]="s.id">{{ specialtyName(s.id) }}</option>
        }
      </select>
      <select
        class="form-select"
        style="max-width: 180px;"
        [ngModel]="statusFilter()"
        (ngModelChange)="statusFilter.set($event)"
      >
        <option [ngValue]="null">{{ 'common.status' | translate }}: {{ 'common.all' | translate }}</option>
        <option [ngValue]="true">{{ 'common.active' | translate }}</option>
        <option [ngValue]="false">{{ 'common.inactive' | translate }}</option>
      </select>
    </div>

    <div class="cp-card p-0">
      <div class="table-responsive">
        <table class="table table-hover mb-0 align-middle">
          <thead>
            <tr>
              <th class="ps-3">{{ 'common.name' | translate }}</th>
              <th>{{ 'admin.colSpecialty' | translate }}</th>
              <th>{{ 'common.price' | translate }}</th>
              <th>{{ 'admin.colRating' | translate }}</th>
              <th>{{ 'common.status' | translate }}</th>
              <th class="pe-3">{{ 'common.actions' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (d of filteredDoctors(); track d.id) {
              <tr>
                <td class="ps-3">
                  <div class="d-flex align-items-center gap-2">
                    <span class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style="width: 32px; height:32px; font-size:.75rem;" [style.background]="d.avatarColor">
                      {{ initials(d.fullName) }}
                    </span>
                    {{ d.fullName }}
                  </div>
                </td>
                <td>{{ specialtyName(d.specialtyId) }}</td>
                <td>{{ d.consultationFee }} {{ 'common.egp' | translate }}</td>
                <td><app-rating-stars [rating]="d.rating" [showValue]="false" /></td>
                <td><span class="badge" [class.text-bg-success]="d.active" [class.text-bg-secondary]="!d.active">{{ (d.active ? 'common.active' : 'common.inactive') | translate }}</span></td>
                <td class="pe-3">
                  <button class="btn btn-sm btn-outline-secondary me-1 ms-1" (click)="openEdit(d)"><i class="bi bi-pencil"></i></button>
                  <button class="btn btn-sm btn-outline-danger" (click)="remove(d)"><i class="bi bi-trash"></i></button>
                </td>
              </tr>
            }
            @if (filteredDoctors().length === 0) {
              <tr><td colspan="6" class="text-center cp-text-muted small py-4">{{ 'common.noResults' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    @if (showModal()) {
      <div class="modal d-block" style="background: rgba(0,0,0,.5); overflow-y: auto;" (click)="showModal.set(false)">
        <div class="modal-dialog modal-dialog-centered modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-content cp-card border-0 p-3">
            <h6 class="fw-bold mb-3">{{ (form.id ? 'admin.editDoctor' : 'admin.newDoctor') | translate }}</h6>
            <div class="row g-2">
              <div class="col-md-6">
                <label class="form-label small">{{ 'common.fullName' | translate }}</label>
                <input class="form-control" [(ngModel)]="form.fullName" />
              </div>
              <div class="col-md-3">
                <label class="form-label small">{{ 'common.gender' | translate }}</label>
                <select class="form-select" [(ngModel)]="form.gender">
                  <option value="male">{{ 'common.male' | translate }}</option>
                  <option value="female">{{ 'common.female' | translate }}</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label small">{{ 'admin.title' | translate }}</label>
                <input class="form-control" [(ngModel)]="form.title" />
              </div>
              <div class="col-md-6">
                <label class="form-label small">{{ 'admin.specialty' | translate }}</label>
                <select class="form-select" [(ngModel)]="form.specialtyId">
                  @for (s of specialties(); track s.id) {
                    <option [value]="s.id">{{ specialtyName(s.id) }}</option>
                  }
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label small">{{ 'admin.consultationFee' | translate }}</label>
                <input class="form-control" type="number" [(ngModel)]="form.consultationFee" />
              </div>
              <div class="col-md-3">
                <label class="form-label small">{{ 'admin.yearsExperience' | translate }}</label>
                <input class="form-control" type="number" [(ngModel)]="form.yearsExperience" />
              </div>
              <div class="col-12">
                <label class="form-label small">{{ 'admin.bio' | translate }}</label>
                <textarea class="form-control" rows="2" [(ngModel)]="form.bio"></textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label small">{{ 'admin.avatarColor' | translate }}</label>
                <div class="d-flex gap-2">
                  @for (c of colors; track c) {
                    <button type="button" class="rounded-circle border-0" style="width: 26px; height: 26px;" [style.background]="c" [style.outline]="form.avatarColor === c ? '2px solid #000' : 'none'" (click)="form.avatarColor = c"></button>
                  }
                </div>
              </div>
              <div class="col-md-6 d-flex align-items-end">
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" [(ngModel)]="form.active" id="docActive" />
                  <label class="form-check-label small" for="docActive">{{ 'common.active' | translate }}</label>
                </div>
              </div>
            </div>

            @if (!form.id) {
              <hr />
              <div class="small fw-semibold mb-2">{{ 'admin.loginAccount' | translate }}</div>
              <div class="row g-2">
                <div class="col-md-6">
                  <input class="form-control" [placeholder]="'admin.usernamePlaceholder' | translate" [(ngModel)]="loginUsername" />
                </div>
                <div class="col-md-6">
                  <input class="form-control" [placeholder]="'admin.passwordPlaceholder' | translate" [(ngModel)]="loginPassword" />
                </div>
              </div>
            }

            <div class="d-flex gap-2 mt-3">
              <button class="btn btn-outline-secondary flex-fill" (click)="showModal.set(false)">{{ 'common.cancel' | translate }}</button>
              <button class="btn btn-primary flex-fill" (click)="save()">{{ 'common.save' | translate }}</button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminDoctors implements OnInit {
  private doctorRepo = inject(DoctorRepository);
  private specialtyRepo = inject(SpecialtyRepository);
  private userRepo = inject(UserRepository);
  private notify = inject(NotificationService);
  private translate = inject(TranslateService);
  protected lang = inject(LanguageService);

  doctors = signal<Doctor[]>([]);
  specialties = signal<Specialty[]>([]);
  showModal = signal(false);
  form: DoctorForm = { ...EMPTY };
  colors = COLORS;
  loginUsername = '';
  loginPassword = '';

  search = signal('');
  specialtyFilter = signal<string | null>(null);
  statusFilter = signal<boolean | null>(null);

  filteredDoctors = computed(() => {
    const term = this.search().trim().toLowerCase();
    const specId = this.specialtyFilter();
    const status = this.statusFilter();
    return this.doctors().filter((d) => {
      const matchesTerm = !term || d.fullName.toLowerCase().includes(term);
      const matchesSpecialty = !specId || d.specialtyId === specId;
      const matchesStatus = status === null || d.active === status;
      return matchesTerm && matchesSpecialty && matchesStatus;
    });
  });

  async ngOnInit(): Promise<void> {
    this.doctors.set(await this.doctorRepo.getAll());
    this.specialties.set(await this.specialtyRepo.getAll());
    if (this.specialties().length) EMPTY.specialtyId = this.specialties()[0].id;
  }

  specialtyName(id: string): string {
    const s = this.specialties().find((sp) => sp.id === id);
    if (!s) return '—';
    return this.lang.lang() === 'ar' ? s.nameAr : s.nameEn;
  }

  initials(name: string): string {
    return name.replace('د.', '').trim().split(' ').slice(0, 2).map((p) => p[0]).join('');
  }

  openNew(): void {
    this.form = { ...EMPTY, id: '', specialtyId: this.specialties()[0]?.id ?? '' };
    this.loginUsername = '';
    this.loginPassword = '';
    this.showModal.set(true);
  }

  openEdit(d: Doctor): void {
    const { shifts, createdAt, updatedAt, ...rest } = d;
    this.form = { ...rest };
    this.showModal.set(true);
  }

  async save(): Promise<void> {
    if (!this.form.fullName || !this.form.specialtyId) {
      this.notify.warn(this.translate.instant('booking.missingFields'), this.translate.instant('admin.missingNameSpecialty'));
      return;
    }
    if (this.form.id) {
      await this.doctorRepo.update(this.form.id, { ...this.form } as any);
    } else {
      const created = await this.doctorRepo.create({
        ...this.form,
        id: uuid(),
        shifts: [],
        createdAt: '',
        updatedAt: '',
      } as any);
      if (this.loginUsername && this.loginPassword) {
        await this.userRepo.create({
          id: uuid(),
          fullName: created.fullName,
          username: this.loginUsername,
          password: this.loginPassword,
          role: 'doctor',
          linkedDoctorId: created.id,
          active: true,
          createdAt: '',
          updatedAt: '',
        } as any);
      }
    }
    this.doctors.set(await this.doctorRepo.getAll());
    this.showModal.set(false);
    this.notify.success(this.translate.instant('admin.saved'));
  }

  async remove(d: Doctor): Promise<void> {
    await this.doctorRepo.remove(d.id);
    this.doctors.set(await this.doctorRepo.getAll());
    this.notify.success(this.translate.instant('admin.deleted'));
  }
}
