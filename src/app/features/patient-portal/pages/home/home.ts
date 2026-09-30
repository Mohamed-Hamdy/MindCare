import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SpecialtyRepository } from '../../../../core/data/specialty.repository';
import { DoctorRepository } from '../../../../core/data/doctor.repository';
import { RatingStars } from '../../../../shared/components/rating-stars/rating-stars';
import { LanguageService } from '../../../../core/services/language.service';
import { Doctor, Gender, Specialty } from '../../../../core/models';

type SortOption = 'rating' | 'priceAsc' | 'priceDesc' | 'experience';

@Component({
  selector: 'app-patient-home',
  standalone: true,
  imports: [FormsModule, RatingStars, TranslatePipe],
  template: `
    <section class="py-5" style="background: linear-gradient(135deg, var(--cp-primary) 0%, var(--cp-primary-dark) 100%);">
      <div class="container text-center text-white">
        <h1 class="cp-fw-800 display-6 mb-2">{{ 'home.heroTitle' | translate }}</h1>
        <p class="mb-0 opacity-75">{{ 'home.heroSubtitle' | translate }}</p>
      </div>
    </section>

    <div class="container py-4">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-4">
        <div class="input-group" style="max-width: 420px;">
          <span class="input-group-text bg-transparent border-end-0"><i class="bi bi-search"></i></span>
          <input
            class="form-control border-start-0"
            [placeholder]="'home.searchPlaceholder' | translate"
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
          />
        </div>

        <select
          class="form-select form-select-sm"
          style="max-width: 160px;"
          [ngModel]="genderFilter()"
          (ngModelChange)="genderFilter.set($event)"
        >
          <option [ngValue]="null">{{ 'home.filterGender' | translate }}: {{ 'common.all' | translate }}</option>
          <option value="male">{{ 'common.male' | translate }}</option>
          <option value="female">{{ 'common.female' | translate }}</option>
        </select>

        <select
          class="form-select form-select-sm"
          style="max-width: 200px;"
          [ngModel]="minRatingFilter()"
          (ngModelChange)="minRatingFilter.set($event)"
        >
          <option [ngValue]="null">{{ 'home.filterMinRating' | translate }}: {{ 'common.all' | translate }}</option>
          <option [ngValue]="4">4+</option>
          <option [ngValue]="4.5">4.5+</option>
          <option [ngValue]="4.8">4.8+</option>
        </select>

        <select
          class="form-select form-select-sm"
          style="max-width: 220px;"
          [ngModel]="sortOption()"
          (ngModelChange)="sortOption.set($event)"
        >
          <option [ngValue]="'rating'">{{ 'home.sortRating' | translate }}</option>
          <option [ngValue]="'priceAsc'">{{ 'home.sortPriceAsc' | translate }}</option>
          <option [ngValue]="'priceDesc'">{{ 'home.sortPriceDesc' | translate }}</option>
          <option [ngValue]="'experience'">{{ 'home.sortExperience' | translate }}</option>
        </select>

        @if (genderFilter() || minRatingFilter() || searchTerm()) {
          <button type="button" class="btn btn-sm btn-outline-secondary" (click)="clearFilters()">
            <i class="bi bi-x-circle me-1 ms-1"></i>{{ 'common.clearFilters' | translate }}
          </button>
        }
      </div>

      <h5 class="cp-fw-800 mb-3">{{ 'home.specialtiesTitle' | translate }}</h5>
      <div class="row g-3 mb-5">
        @for (s of specialties(); track s.id) {
          <div class="col-6 col-md-4 col-lg-2">
            <button
              type="button"
              class="cp-card cp-card--hover w-100 h-100 border-0 p-3 text-center bg-transparent"
              [class.border]="selectedSpecialtyId() === s.id"
              style="cursor:pointer;"
              (click)="toggleSpecialty(s.id)"
            >
              <div
                class="rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center"
                style="width: 52px; height: 52px; background: var(--cp-primary-light); color: var(--cp-primary); font-size: 1.4rem;"
              >
                <i class="bi" [class]="s.icon"></i>
              </div>
              <div class="small fw-semibold">{{ specialtyDisplayName(s) }}</div>
            </button>
          </div>
        }
      </div>

      <h5 class="cp-fw-800 mb-3">
        {{ 'home.doctorsTitle' | translate }}
        <span class="cp-text-muted fw-normal small">({{ filteredDoctors().length }})</span>
      </h5>

      @if (filteredDoctors().length === 0) {
        <div class="cp-card p-5 text-center cp-text-muted">
          <i class="bi bi-emoji-frown fs-2 d-block mb-2"></i>
          {{ 'home.noDoctors' | translate }}
        </div>
      }

      <div class="row g-3">
        @for (doc of filteredDoctors(); track doc.id) {
          <div class="col-md-6 col-lg-4">
            <div class="cp-card cp-card--hover h-100 p-3 d-flex flex-column">
              <div class="d-flex align-items-center gap-3 mb-2">
                <span
                  class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                  style="width: 56px; height: 56px; font-size: 1.1rem;"
                  [style.background]="doc.avatarColor"
                >
                  {{ initials(doc.fullName) }}
                </span>
                <div>
                  <div class="fw-bold">{{ doc.fullName }}</div>
                  <div class="small cp-text-muted">{{ doc.title }} — {{ specialtyNameById(doc.specialtyId) }}</div>
                </div>
              </div>
              <app-rating-stars [rating]="doc.rating" [count]="doc.ratingCount" class="mb-2" />
              <div class="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
                <div>
                  <div class="small cp-text-muted">{{ 'home.consultationFee' | translate }}</div>
                  <div class="fw-bold" style="color: var(--cp-primary);">
                    {{ doc.consultationFee }} {{ 'common.egp' | translate }}
                  </div>
                </div>
                <button class="btn btn-primary btn-sm" (click)="book(doc)">
                  {{ 'home.bookNow' | translate }} <i class="bi bi-arrow-left ms-1 me-1"></i>
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class PatientHome implements OnInit {
  private specialtyRepo = inject(SpecialtyRepository);
  private doctorRepo = inject(DoctorRepository);
  private router = inject(Router);
  protected lang = inject(LanguageService);

  specialties = signal<Specialty[]>([]);
  doctors = signal<Doctor[]>([]);
  selectedSpecialtyId = signal<string | null>(null);
  searchTerm = signal('');
  genderFilter = signal<Gender | null>(null);
  minRatingFilter = signal<number | null>(null);
  sortOption = signal<SortOption>('rating');

  filteredDoctors = computed(() => {
    const specId = this.selectedSpecialtyId();
    const term = this.searchTerm().trim().toLowerCase();
    const gender = this.genderFilter();
    const minRating = this.minRatingFilter();
    const sort = this.sortOption();

    const filtered = this.doctors().filter((d) => {
      const matchesSpecialty = !specId || d.specialtyId === specId;
      const matchesTerm =
        !term ||
        d.fullName.toLowerCase().includes(term) ||
        this.specialtyNameById(d.specialtyId).toLowerCase().includes(term);
      const matchesGender = !gender || d.gender === gender;
      const matchesRating = !minRating || d.rating >= minRating;
      return matchesSpecialty && matchesTerm && matchesGender && matchesRating && d.active;
    });

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'priceAsc':
          return a.consultationFee - b.consultationFee;
        case 'priceDesc':
          return b.consultationFee - a.consultationFee;
        case 'experience':
          return b.yearsExperience - a.yearsExperience;
        case 'rating':
        default:
          return b.rating - a.rating;
      }
    });
  });

  async ngOnInit(): Promise<void> {
    this.specialties.set(await this.specialtyRepo.getAll());
    this.doctors.set(await this.doctorRepo.getAll());
  }

  toggleSpecialty(id: string): void {
    this.selectedSpecialtyId.set(this.selectedSpecialtyId() === id ? null : id);
  }

  specialtyDisplayName(s: Specialty): string {
    return this.lang.lang() === 'ar' ? s.nameAr : s.nameEn;
  }

  specialtyNameById(id: string): string {
    const s = this.specialties().find((sp) => sp.id === id);
    return s ? this.specialtyDisplayName(s) : '';
  }

  initials(name: string): string {
    return name.replace('د.', '').trim().split(' ').slice(0, 2).map((p) => p[0]).join('');
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.genderFilter.set(null);
    this.minRatingFilter.set(null);
  }

  book(doc: Doctor): void {
    this.router.navigate(['/book', doc.id]);
  }
}
