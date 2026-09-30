import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/public-shell/public-shell').then((m) => m.PublicShell),
    children: [
      { path: '', loadComponent: () => import('./features/patient-portal/pages/home/home').then((m) => m.PatientHome) },
      {
        path: 'book/:doctorId',
        loadComponent: () => import('./features/patient-portal/pages/booking/booking').then((m) => m.Booking),
      },
      {
        path: 'my-appointments',
        loadComponent: () =>
          import('./features/patient-portal/pages/my-appointments/my-appointments').then((m) => m.MyAppointments),
      },
      { path: 'login', loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login) },
    ],
  },
  {
    path: 'admin',
    canMatch: [roleGuard('admin')],
    loadComponent: () => import('./layout/app-shell/app-shell').then((m) => m.AppShell),
    children: [
      { path: '', loadComponent: () => import('./features/admin/pages/dashboard/dashboard').then((m) => m.AdminDashboard) },
      { path: 'doctors', loadComponent: () => import('./features/admin/pages/doctors/doctors').then((m) => m.AdminDoctors) },
      {
        path: 'specialties',
        loadComponent: () => import('./features/admin/pages/specialties/specialties').then((m) => m.AdminSpecialties),
      },
      {
        path: 'medicines',
        loadComponent: () => import('./features/admin/pages/medicines/medicines').then((m) => m.AdminMedicines),
      },
      {
        path: 'services-tests',
        loadComponent: () =>
          import('./features/admin/pages/services-tests/services-tests').then((m) => m.AdminServicesTests),
      },
      { path: 'shifts', loadComponent: () => import('./features/admin/pages/shifts/shifts').then((m) => m.AdminShifts) },
      {
        path: 'invoices',
        loadComponent: () => import('./features/billing/pages/invoices-list/invoices-list').then((m) => m.InvoicesList),
      },
      {
        path: 'invoices/new',
        loadComponent: () =>
          import('./features/billing/pages/invoice-editor/invoice-editor').then((m) => m.InvoiceEditor),
      },
    ],
  },
  {
    path: 'reception',
    canMatch: [roleGuard('reception')],
    loadComponent: () => import('./layout/app-shell/app-shell').then((m) => m.AppShell),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/reception/pages/queue-board/queue-board').then((m) => m.QueueBoard),
      },
      {
        path: 'invoices',
        loadComponent: () => import('./features/billing/pages/invoices-list/invoices-list').then((m) => m.InvoicesList),
      },
      {
        path: 'invoices/new',
        loadComponent: () =>
          import('./features/billing/pages/invoice-editor/invoice-editor').then((m) => m.InvoiceEditor),
      },
    ],
  },
  {
    path: 'doctor',
    canMatch: [roleGuard('doctor')],
    loadComponent: () => import('./layout/app-shell/app-shell').then((m) => m.AppShell),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/doctor/pages/patient-list/patient-list').then((m) => m.DoctorPatientList),
      },
      {
        path: 'patient/:appointmentId',
        loadComponent: () =>
          import('./features/doctor/pages/patient-record/patient-record').then((m) => m.PatientRecord),
      },
    ],
  },
  {
    path: 'pharmacy',
    canMatch: [roleGuard('pharmacy')],
    loadComponent: () => import('./layout/app-shell/app-shell').then((m) => m.AppShell),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/pharmacy/pages/inventory/inventory').then((m) => m.PharmacyInventory),
      },
      {
        path: 'dispense',
        loadComponent: () => import('./features/pharmacy/pages/dispense/dispense').then((m) => m.PharmacyDispense),
      },
    ],
  },
  {
    path: 'lab',
    canMatch: [roleGuard('lab')],
    loadComponent: () => import('./layout/app-shell/app-shell').then((m) => m.AppShell),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/lab/pages/test-tracking/test-tracking').then((m) => m.TestTracking),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
