import { Injectable, inject } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { SpecialtyRepository } from './specialty.repository';
import { DoctorRepository } from './doctor.repository';
import { MedicineRepository } from './medicine.repository';
import { LabTestTypeRepository } from './lab-test-type.repository';
import { UserRepository } from './user.repository';
import { PatientRepository } from './patient.repository';
import { Doctor, Medicine, LabTestType, AppUser, Specialty, Patient, WeeklyShift } from '../models';

const now = () => new Date().toISOString();

function weeklyShift(days: number[], start: string, end: string, slot = 15): WeeklyShift[] {
  return days.map((dayOfWeek) => ({ dayOfWeek, startTime: start, endTime: end, slotDurationMinutes: slot }));
}

/**
 * Seeds a realistic demo dataset on first launch so MindCare is usable
 * immediately, without any backend. Runs once — guarded by a flag in
 * localStorage so re-visits don't duplicate data.
 */
@Injectable({ providedIn: 'root' })
export class SeedService {
  private specialtyRepo = inject(SpecialtyRepository);
  private doctorRepo = inject(DoctorRepository);
  private medicineRepo = inject(MedicineRepository);
  private labTestRepo = inject(LabTestTypeRepository);
  private userRepo = inject(UserRepository);
  private patientRepo = inject(PatientRepository);

  private readonly SEED_FLAG = 'cp_seeded_v1';

  async seedIfNeeded(): Promise<void> {
    if (localStorage.getItem(this.SEED_FLAG) === 'true') return;

    const specialties = this.buildSpecialties();
    await this.specialtyRepo.bulkSeed(specialties);

    const doctors = this.buildDoctors(specialties);
    await this.doctorRepo.bulkSeed(doctors);

    await this.medicineRepo.bulkSeed(this.buildMedicines());
    await this.labTestRepo.bulkSeed(this.buildLabTests());

    const patients = this.buildPatients();
    await this.patientRepo.bulkSeed(patients);

    await this.userRepo.bulkSeed(this.buildUsers(doctors));

    localStorage.setItem(this.SEED_FLAG, 'true');
  }

  private buildSpecialties(): Specialty[] {
    const defs: Array<[string, string, string]> = [
      ['باطنة عامة', 'Internal Medicine', 'bi-heart-pulse'],
      ['أطفال', 'Pediatrics', 'bi-emoji-smile'],
      ['جلدية', 'Dermatology', 'bi-bandaid'],
      ['عظام', 'Orthopedics', 'bi-bone'],
      ['نساء وتوليد', 'Obstetrics & Gynecology', 'bi-gender-female'],
      ['أسنان', 'Dentistry', 'bi-emoji-laughing'],
    ];
    return defs.map(([nameAr, nameEn, icon]) => ({
      id: uuid(),
      nameAr,
      nameEn,
      icon,
      active: true,
      createdAt: now(),
      updatedAt: now(),
    }));
  }

  private buildDoctors(specialties: Specialty[]): Doctor[] {
    const byName = (nameAr: string) => specialties.find((s) => s.nameAr === nameAr)!.id;
    const colors = ['#0f7d8c', '#2a9d8f', '#3b82c4', '#8a5cf5', '#e6a417', '#d64545'];
    const defs: Array<Partial<Doctor> & { specialtyName: string }> = [
      {
        fullName: 'د. أحمد المصري',
        specialtyName: 'باطنة عامة',
        title: 'استشاري',
        gender: 'male',
        consultationFee: 300,
        rating: 4.8,
        ratingCount: 214,
        yearsExperience: 18,
        shifts: weeklyShift([0, 1, 2, 3], '09:00', '15:00'),
      },
      {
        fullName: 'د. سارة عبد الله',
        specialtyName: 'أطفال',
        title: 'أخصائي',
        gender: 'female',
        consultationFee: 250,
        rating: 4.9,
        ratingCount: 341,
        yearsExperience: 11,
        shifts: weeklyShift([0, 2, 4], '10:00', '18:00'),
      },
      {
        fullName: 'د. محمد سمير',
        specialtyName: 'جلدية',
        title: 'استشاري',
        gender: 'male',
        consultationFee: 350,
        rating: 4.6,
        ratingCount: 156,
        yearsExperience: 14,
        shifts: weeklyShift([1, 3, 5], '12:00', '20:00'),
      },
      {
        fullName: 'د. نورهان فتحي',
        specialtyName: 'عظام',
        title: 'أخصائي',
        gender: 'female',
        consultationFee: 280,
        rating: 4.7,
        ratingCount: 98,
        yearsExperience: 9,
        shifts: weeklyShift([0, 1, 3, 4], '09:00', '14:00'),
      },
      {
        fullName: 'د. هبة كمال',
        specialtyName: 'نساء وتوليد',
        title: 'استشاري',
        gender: 'female',
        consultationFee: 320,
        rating: 4.9,
        ratingCount: 402,
        yearsExperience: 16,
        shifts: weeklyShift([0, 2, 3, 5], '11:00', '19:00'),
      },
      {
        fullName: 'د. كريم عادل',
        specialtyName: 'أسنان',
        title: 'أخصائي',
        gender: 'male',
        consultationFee: 200,
        rating: 4.5,
        ratingCount: 87,
        yearsExperience: 7,
        shifts: weeklyShift([1, 2, 4, 6], '10:00', '17:00'),
      },
    ];

    return defs.map((d, i) => ({
      id: uuid(),
      fullName: d.fullName!,
      gender: d.gender!,
      specialtyId: byName(d.specialtyName),
      title: d.title!,
      bio: `${d.title} ${d.fullName} بخبرة ${d.yearsExperience} عامًا في مجال التخصص.`,
      avatarColor: colors[i % colors.length],
      consultationFee: d.consultationFee!,
      rating: d.rating!,
      ratingCount: d.ratingCount!,
      yearsExperience: d.yearsExperience!,
      shifts: d.shifts!,
      active: true,
      createdAt: now(),
      updatedAt: now(),
    }));
  }

  private buildMedicines(): Medicine[] {
    const defs: Array<[string, string, string, number, number, number]> = [
      ['باراسيتامول', 'أقراص', '500mg', 5, 400, 50],
      ['أموكسيسيلين', 'كبسولات', '500mg', 12, 150, 30],
      ['أوجمنتين', 'أقراص', '1g', 35, 80, 20],
      ['فولتارين', 'جل', '1%', 45, 60, 15],
      ['زيرتك', 'أقراص', '10mg', 18, 120, 25],
      ['نيوروفيت', 'كبسولات', '-', 60, 90, 20],
      ['بانادول إكسترا', 'أقراص', '500mg', 8, 300, 40],
      ['فلاجيل', 'أقراص', '500mg', 15, 70, 20],
      ['كلاريتين', 'شراب', '60ml', 25, 40, 10],
      ['ريهيدرات', 'أكياس', '-', 6, 200, 30],
    ];
    return defs.map(([name, form, strength, unitPrice, qty, min]) => ({
      id: uuid(),
      name,
      form,
      strength,
      unitPrice,
      quantityInStock: qty,
      minStockThreshold: min,
      active: true,
      createdAt: now(),
      updatedAt: now(),
    }));
  }

  private buildLabTests(): LabTestType[] {
    const defs: Array<[string, number, number]> = [
      ['صورة دم كاملة CBC', 80, 3],
      ['وظائف كبد', 120, 6],
      ['وظائف كلى', 120, 6],
      ['سكر صائم', 40, 2],
      ['تحليل بول كامل', 50, 3],
      ['وظائف الغدة الدرقية', 200, 24],
    ];
    return defs.map(([name, price, turnaroundHours]) => ({
      id: uuid(),
      name,
      price,
      turnaroundHours,
      active: true,
      createdAt: now(),
      updatedAt: now(),
    }));
  }

  private buildPatients(): Patient[] {
    const defs: Array<[string, string, string, 'male' | 'female']> = [
      ['ياسمين علي', '01011122233', 'yasmin.demo@example.com', 'female'],
      ['عمر حسن', '01099988877', 'omar.demo@example.com', 'male'],
    ];
    return defs.map(([fullName, phone, email, gender]) => ({
      id: uuid(),
      fullName,
      phone,
      email,
      gender,
      medicalHistory: { attachments: [] },
      vitals: [],
      createdAt: now(),
      updatedAt: now(),
    }));
  }

  private buildUsers(doctors: Doctor[]): AppUser[] {
    const base: Array<[string, string, string, AppUser['role'], string | undefined]> = [
      ['مدير النظام', 'admin', 'admin123', 'admin', undefined],
      ['موظف الاستقبال', 'reception', 'reception123', 'reception', undefined],
      ['الصيدلية', 'pharmacy', 'pharmacy123', 'pharmacy', undefined],
      ['المعمل', 'lab', 'lab123', 'lab', undefined],
    ];
    const users: AppUser[] = base.map(([fullName, username, password, role]) => ({
      id: uuid(),
      fullName,
      username,
      password,
      role,
      active: true,
      createdAt: now(),
      updatedAt: now(),
    }));

    doctors.forEach((doc, i) => {
      users.push({
        id: uuid(),
        fullName: doc.fullName,
        username: `doctor${i + 1}`,
        password: 'doctor123',
        role: 'doctor',
        linkedDoctorId: doc.id,
        active: true,
        createdAt: now(),
        updatedAt: now(),
      });
    });

    return users;
  }
}
