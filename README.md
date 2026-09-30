# MindCare — Clinic & Medical Center Management Platform
<img width="1920" height="1080" alt="mindcare-cover-1" src="https://github.com/user-attachments/assets/39044c83-abed-4fb4-835b-1865d8521753" />

A clinic and medical-center management platform, built two ways in one repo:

- **Client-side only (default, what's live on GitHub Pages)** — no backend
  server required, all data stored locally in the browser via **IndexedDB**.
  Instantly usable, free to host, zero setup.
- **Full-stack** — a real [Spring Boot + PostgreSQL API](backend/README.md)
  that the exact same Angular frontend can talk to instead of IndexedDB
  (Auth, Specialties, Doctors, Patients, and Appointments so far), switched on
  with a single runtime flag — no rebuild, no separate deployment of the
  frontend. See [backend/README.md](backend/README.md) for how to run it and
  turn it on.

This README covers the client-side build below; jump to
[backend/README.md](backend/README.md) for the full-stack version.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 21 (Standalone Components, latest version compatible with the runtime) |
| State management | Angular Signals |
| Local storage | IndexedDB via the `idb` library (generic Repository layer — see Clean Architecture below) |
| UI | Bootstrap 5.3 (RTL/LTR) + SCSS + Cairo font + Dark/Light mode via `data-bs-theme` |
| Email verification (OTP) | `@emailjs/browser` |
| WhatsApp | Fetch call to the WhatsApp Business API, with automatic fallback to a `wa.me` link on failure |
| PDF export | `jsPDF` + `html2canvas` (for correct Arabic RTL rendering) + `qrcode` |
| Language | Fully strict TypeScript (`strict: true`, `strictTemplates: true`) |
| i18n | Bilingual EN/AR with `@ngx-translate/core`, runtime-swapped Bootstrap RTL/LTR stylesheets |

## Architecture (Clean Architecture)

```
src/app/
  core/
    models/        ← Data models (Domain Layer) — no dependencies on anything else
    data/           ← Data layer: IndexedDB schema + generic Repository per entity
    services/       ← Shared services: Auth, OTP, WhatsApp, PDF, Theme, Notifications
    guards/         ← Role-based route guards
    config/         ← EmailJS / WhatsApp / clinic settings
  shared/           ← Reusable UI components
  layout/           ← Page shells (patient portal / staff dashboard)
  features/         ← Each system module in its own folder
    patient-portal/ ← Patient booking portal
    reception/      ← Front desk and live waiting queue
    doctor/         ← Patient record and e-prescription
    pharmacy/       ← Pharmacy and inventory
    lab/             ← Lab test tracking
    billing/        ← Invoicing
    admin/          ← Fully dynamic admin panel (full CRUD)
```

Every screen reads its state from `repository.items()` (an Angular Signal), so
any change made from the admin panel (add/edit/delete a doctor, medication,
specialty...) is reflected instantly across every screen with no hardcoded
data in the codebase.

## Running Locally

```bash
npm install
npm start        # opens on http://localhost:4200
```

On first run, the app automatically seeds demo data: 6 specialties, 6
doctors, 10 medications, 6 lab tests, and 2 sample patients — plus staff
login accounts.

### Demo Login Accounts

| Role | Username | Password |
|---|---|---|
| System admin | `admin` | `admin123` |
| Reception | `reception` | `reception123` |
| Doctor (any of the 6) | `doctor1` ... `doctor6` | `doctor123` |
| Pharmacy | `pharmacy` | `pharmacy123` |
| Lab | `lab` | `lab123` |

## Enabling Real Integrations (Optional)

The project runs fully in "demo mode" with no extra setup:
- The OTP verification code is shown directly in an on-screen notification instead of being emailed.
- WhatsApp notifications automatically open as a ready-to-send `wa.me` link.

To enable real sending, edit `src/app/core/config/app-config.ts`:

```ts
emailjs: {
  serviceId: 'YOUR_EMAILJS_SERVICE_ID',
  templateId: 'YOUR_OTP_TEMPLATE_ID',
  notifyTemplateId: 'YOUR_NOTIFY_TEMPLATE_ID', // optional
  publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
},
whatsapp: {
  apiUrl: 'https://graph.facebook.com/vXX.X/PHONE_ID/messages',
  apiToken: 'YOUR_WHATSAPP_CLOUD_API_TOKEN',
},
```

The EmailJS OTP template needs these variables: `{{to_email}}`,
`{{otp_code}}`, `{{ttl_minutes}}`, `{{clinic_name}}`.

## Building for Production

```bash
npm run build
```

The output lands in `dist/MindCare/browser` — a fully static folder ready to
deploy to any static host: Netlify, Vercel, GitHub Pages, Firebase Hosting,
etc. No server or database setup required.

### Quick Deploy

- **Netlify**: drag the `dist/MindCare/browser` folder onto [app.netlify.com/drop](https://app.netlify.com/drop)
- **Vercel**: `vercel --prod dist/MindCare/browser` (after `npm i -g vercel`)
- **GitHub Pages**: push the `dist/MindCare/browser` contents to a `gh-pages` branch, or use the GitHub Actions workflow included in this repo

> Note: since routing uses Browser History mode, make sure your host
> redirects all unmatched routes to `index.html` (SPA fallback) — this is
> enabled automatically on Netlify and Vercel; on GitHub Pages, copy
> `index.html` to `404.html`.

## Live Demo

🔗 **https://mohamed-hamdy.github.io/MindCare/**

## Implemented Modules

- ✅ **Patient booking portal**: choose a specialty/doctor by rating and price, a smart slot picker that automatically prevents conflicts based on doctor shifts, a medical history form with Base64 image uploads, and 6-digit OTP confirmation via EmailJS with a 5-minute countdown and a max-attempts limit.
- ✅ **Reception**: a live waiting queue (waiting / in exam / completed / emergency), check-in, automatic WhatsApp notification with `wa.me` fallback, and the ability to add an emergency case that jumps the queue.
- ✅ **Doctor dashboard**: a full EMR (medical history, vital signs), an e-prescription editor for medications/dosages, PDF export with clinic letterhead and a QR code, and lab test requests directly from the patient record.
- ✅ **Pharmacy & lab**: automatic stock deduction on dispensing, low-stock alerts, and lab test status tracking with email notification when results are ready.
- ✅ **Billing**: automatic aggregation of exam fees + dispensed medications + lab tests, adjustable discounts and tax, multiple payment methods, and PDF export.
- ✅ **Admin panel**: full CRUD for doctors, specialties, medications & inventory, services & lab tests, and per-doctor schedules/shifts — nothing hardcoded in the code, every change reflects instantly across all screens.
- ✅ **Bilingual EN/AR**: full interface switch between English (LTR) and Arabic (RTL), including runtime-swapped Bootstrap stylesheets so every component (not just utility classes) renders correctly in both directions.

## Known Limitations (Client-Side Only)

- There is no real backend in this mode, so each browser's data is separate (no sync across devices) — see the [full-stack version](backend/README.md) if you need a shared/real backend.
- Passwords are stored as plain text in IndexedDB — acceptable for a fully client-side demo app, not suitable for a real production environment without changes.
- Real email and WhatsApp sending rely on publishable keys called directly from the browser (there is no server to hide them) — this is the only pattern available in a fully client-side app.

## Full-Stack Version (Spring Boot + PostgreSQL)

The repo also ships a real backend under [`backend/`](backend/README.md) —
Spring Boot 3, Spring Security (JWT), Spring Data JPA, PostgreSQL, Flyway —
and the Angular frontend above is actually wired up to it, not just sitting
next to it: Auth, Specialties, Doctors (with shifts), Patients, and
Appointments all go through the API instead of IndexedDB once you turn
backend mode on. Pharmacy/Lab/Billing and staff-account management are still
IndexedDB-only for now (see [backend/README.md](backend/README.md#scope-mvp)
for the exact scope).

Nothing here changes by default — the GitHub Pages demo keeps running
client-side-only. To try the full-stack version:

```bash
docker compose up --build      # starts PostgreSQL + the API on :8080
npm start                      # starts the Angular dev server on :4200
```

then, in the browser, either open the app with
`http://localhost:4200/?apiUrl=http://localhost:8080` once, or run
`localStorage.setItem('cp_api_base_url', 'http://localhost:8080')` in the
console and reload. Log in with the same [demo accounts](#demo-login-accounts)
as above — full details, the API reference, and the current limitations of
this first pass are in [backend/README.md](backend/README.md).

## License

[MIT](LICENSE) — free to use, fork, and build on for your own projects or learning.
