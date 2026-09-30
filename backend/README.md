# MindCare Backend (Spring Boot API)

A real REST API for the MindCare clinic platform — Spring Boot 3 + Spring
Security (JWT) + Spring Data JPA + PostgreSQL + Flyway, documented with
OpenAPI/Swagger. This is an **addition** alongside the existing fully
client-side (IndexedDB) Angular build; it does not replace it. The GitHub
Pages demo keeps using the zero-backend build so it stays free to host and
instantly usable. This backend is here for anyone who wants to run — or
extend — the "real" full-stack version locally.

## Scope (MVP)

This first version covers: **authentication, doctors, specialties, patients,
and the appointment booking/queue workflow**, plus admin management of staff
accounts. Pharmacy, lab, billing and e-prescriptions are not implemented yet
(they still only exist in the client-side/IndexedDB build) — the same
Repository-style structure here makes it straightforward to add them the
same way, module by module.

## Tech stack

| Layer | Choice |
|---|---|
| Language / runtime | Java 21 |
| Framework | Spring Boot 3.3 (Web, Data JPA, Security, Validation) |
| Database | PostgreSQL 16 |
| Migrations | Flyway |
| Auth | JWT (jjwt), BCrypt password hashing |
| API docs | springdoc-openapi (Swagger UI) |
| Build | Maven |

## Running it

### Option A — Docker Compose (everything, one command)

From the repo root:

```bash
docker compose up --build
```

This starts PostgreSQL and the API together. Flyway runs the migrations
(schema + demo seed data) automatically on startup.

- API base URL: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

Then run the Angular frontend separately as usual (`npm start` from the repo
root, opens on `http://localhost:4200`) — see "Wiring it to the frontend"
below.

### Option B — Run the backend directly with Maven

Requires a local PostgreSQL instance (or `docker run -e POSTGRES_DB=mindcare
-e POSTGRES_USER=mindcare -e POSTGRES_PASSWORD=mindcare -p 5432:5432
postgres:16-alpine`).

```bash
cd backend
mvn spring-boot:run
```

Configuration is environment-variable driven (see `src/main/resources/application.yml`):

| Variable | Default | Purpose |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/mindcare` | JDBC URL |
| `DB_USERNAME` | `mindcare` | DB user |
| `DB_PASSWORD` | `mindcare` | DB password |
| `SERVER_PORT` | `8080` | API port |
| `JWT_SECRET` | demo-only value | **Change this** outside of local/demo use |
| `JWT_EXPIRATION_MINUTES` | `480` | Token lifetime |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4200,https://mohamed-hamdy.github.io` | Comma-separated allowed origins |

## Demo accounts

Same usernames/passwords as the client-side demo, now backed by real BCrypt
hashes instead of plaintext:

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Reception | `reception` | `reception123` |
| Doctor (any of the 6 seeded doctors) | `doctor1` … `doctor6` | `doctor123` |
| Pharmacy | `pharmacy` | `pharmacy123` |
| Lab | `lab` | `lab123` |

`POST /api/auth/login` with one of these returns a JWT — send it back as
`Authorization: Bearer <token>` on subsequent requests.

## API overview

All endpoints are namespaced under `/api`. Public endpoints (no token
needed) are marked **public**; everything else needs a valid JWT, and
`/api/admin/**` additionally requires the `ADMIN` role.

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | public | Returns `{ token, user }` |
| GET | `/api/auth/me` | authenticated | Current user profile |
| GET | `/api/specialties` | public | List |
| GET | `/api/specialties/{id}` | public | |
| POST/PUT/DELETE | `/api/specialties/{id}` | ADMIN | |
| GET | `/api/doctors?specialtyId=&activeOnly=` | public | Filterable list |
| GET | `/api/doctors/{id}` | public | Includes weekly shifts |
| POST/PUT/DELETE | `/api/doctors/{id}` | ADMIN | Body includes `shifts[]` |
| GET | `/api/patients` | staff | |
| GET | `/api/patients/{id}` | staff | |
| POST | `/api/patients` | public | Used by the booking form |
| PUT | `/api/patients/{id}` | staff | |
| GET | `/api/appointments?doctorId=&date=` | staff | |
| GET | `/api/appointments/{id}` | staff | |
| POST | `/api/appointments` | public | Booking — see below |
| PATCH | `/api/appointments/{id}/status` | staff | `{ "status": "WAITING" \| "IN_EXAM" \| "COMPLETED" \| "CANCELLED" \| "EMERGENCY" }` |
| GET/POST/PUT/DELETE | `/api/admin/users` | ADMIN | Staff account management |

### Booking an appointment

`POST /api/appointments` derives the slot's end time and validates it against
the doctor's weekly shifts (the same "smart slot" rule the Angular patient
portal enforces client-side), and rejects overlapping bookings for that
doctor. Either pass an existing `patientId`, or a `newPatient` object to
create-or-reuse a patient by phone/email in the same call:

```json
{
  "doctorId": "…",
  "date": "2026-10-05",
  "startTime": "10:00",
  "reasonForVisit": "Follow-up",
  "newPatient": { "fullName": "…", "phone": "…", "email": "…", "gender": "FEMALE" }
}
```

**Simplification vs. the client-side build**: the IndexedDB demo has a full
email-OTP confirmation step before an appointment is confirmed. This backend
MVP doesn't have an email provider wired in yet, so bookings are created
directly as `CONFIRMED` — reception can still walk them through
`WAITING → IN_EXAM → COMPLETED` as normal. Adding OTP back (e.g. via a
transactional email API) is a natural next module.

## Wiring it to the frontend

The Angular app is actually wired up to this API — it's not just a
standalone backend sitting next to the frontend. Auth, Specialties, Doctors
(including shifts), Patients, and Appointments all talk to this API instead
of IndexedDB once you turn backend mode on; Pharmacy/Lab/Billing/e-prescriptions
and staff-account (admin user) management stay IndexedDB-only for now, matching
this MVP's scope above.

### Turning it on

There is **no Angular environment file / build-time flag** involved on
purpose — the exact same static build that's deployed on GitHub Pages can
talk to a real backend just by setting one thing at runtime, so the live demo
is completely unaffected unless you opt in yourself:

```js
// In the browser console, on any MindCare tab:
localStorage.setItem('cp_api_base_url', 'http://localhost:8080');
// then reload the page
```

or open the app once with `?apiUrl=http://localhost:8080` in the URL (the
value is saved to `localStorage` and stripped from the address bar
automatically). To go back to the zero-backend IndexedDB build:
`localStorage.removeItem('cp_api_base_url')` and reload.

Log in with any of the [demo accounts](#demo-accounts) above — the same
username/password pairs work in both modes, since the seed data mirrors the
client-side demo dataset exactly.

### How it's implemented

- `BackendConfigService` (`src/app/core/services/backend-config.service.ts`)
  owns the `cp_api_base_url` flag and the JWT (`cp_api_token`).
- `ApiClient` (`src/app/core/data/backend/api-client.ts`) is a thin
  `HttpClient` wrapper that adds the base URL and `Authorization: Bearer`
  header.
- `src/app/core/data/backend/mappers.ts` converts between the Angular models
  (camelCase, lowercase enums like `'in-exam'`) and this API's JSON DTOs
  (uppercase enums like `IN_EXAM`, `HH:mm:ss` times).
- `SpecialtyRepository`, `DoctorRepository`, `PatientRepository`,
  `AppointmentRepository`, and `AuthService` each check
  `backendConfig.isEnabled()` and, when on, call this API through `ApiClient`
  instead of IndexedDB — same public methods (`getAll`, `create`, `update`,
  the `items` signal, `login`), so every screen that already injects them
  works unchanged in either mode.
- `SeedService` skips seeding Specialties/Doctors/Patients/Users into
  IndexedDB when backend mode is on (this API already has its own seed data),
  but still seeds Medicine/LabTestType locally either way, since those
  modules aren't wired to this API yet.

### Known limitations of this first pass

- **Patient vitals and file attachments** (`Patient.vitals`,
  `Patient.medicalHistory.attachments`) have no backend table yet — they stay
  IndexedDB-only. In backend mode they're kept in memory alongside whatever
  patient record this API returns, but they are **not persisted** by this API
  and won't survive if this API's own patient list is the source of truth on
  a different device/browser.
- **The patient-portal's email-OTP step is a no-op formality in backend
  mode.** `POST /api/appointments` books (and confirms) the appointment
  immediately — there's no email provider wired into this API — so the OTP
  screen still runs client-side but isn't actually gating anything server-side.
- **Creating a doctor from the Admin → Doctors screen also offers to create a
  login for them** — that login account is still created in IndexedDB only
  (admin/staff-account management isn't wired to this API in this MVP), so a
  doctor added this way can't actually log in against this API yet without
  also being added via `AdminUserController` (e.g. through Swagger UI).
- Error handling on the frontend side is minimal for now (failed requests
  surface as thrown errors) — this first pass prioritized getting real
  create/read/update flows working end-to-end over polished failure UX.

## A note on how this was built

This backend was authored by an AI pair-programming session working from
this repo's existing Angular domain models. It could not be compiled inside
that session's sandboxed environment (Maven Central was blocked by network
policy there), so **run `mvn -q -f backend/pom.xml compile` (or
`docker compose up --build`) as your first step** to confirm everything
builds clean before relying on it, and open an issue/PR for anything that
needs a fix.

## Project layout

```
backend/
  src/main/java/com/mindcare/backend/
    config/       ← Security & OpenAPI configuration
    security/     ← JWT issuing/parsing, Spring Security UserDetails adapter
    domain/       ← JPA entities + enums
    repository/   ← Spring Data JPA repositories
    dto/          ← Request/response records, one package per resource
    service/      ← Business logic, transaction boundaries
    controller/   ← REST controllers
  src/main/resources/
    application.yml
    db/migration/ ← Flyway SQL migrations (schema + demo seed data)
  src/test/       ← Unit tests
  Dockerfile
```
