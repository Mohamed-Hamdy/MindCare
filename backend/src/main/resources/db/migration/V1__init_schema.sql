-- MindCare backend — initial schema
-- Mirrors the domain models used by the Angular frontend (src/app/core/models)
-- so the two layers stay a straightforward mapping of each other.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE specialties (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar     VARCHAR(120) NOT NULL,
    name_en     VARCHAR(120) NOT NULL,
    icon        VARCHAR(60)  NOT NULL,
    description VARCHAR(500),
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE doctors (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name           VARCHAR(150) NOT NULL,
    gender              VARCHAR(10)  NOT NULL CHECK (gender IN ('MALE', 'FEMALE')),
    specialty_id        UUID NOT NULL REFERENCES specialties (id),
    title               VARCHAR(80)  NOT NULL,
    bio                 VARCHAR(1000),
    avatar_color        VARCHAR(20)  NOT NULL,
    consultation_fee    NUMERIC(10, 2) NOT NULL,
    rating              NUMERIC(2, 1) NOT NULL DEFAULT 0,
    rating_count        INTEGER NOT NULL DEFAULT 0,
    years_experience    INTEGER NOT NULL DEFAULT 0,
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_doctors_specialty_id ON doctors (specialty_id);

CREATE TABLE doctor_shifts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id               UUID NOT NULL REFERENCES doctors (id) ON DELETE CASCADE,
    day_of_week             INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time              TIME NOT NULL,
    end_time                TIME NOT NULL,
    slot_duration_minutes   INTEGER NOT NULL DEFAULT 15
);

CREATE INDEX idx_doctor_shifts_doctor_id ON doctor_shifts (doctor_id);

CREATE TABLE patients (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name             VARCHAR(150) NOT NULL,
    phone                 VARCHAR(30)  NOT NULL,
    email                 VARCHAR(150) NOT NULL,
    gender                VARCHAR(10)  NOT NULL CHECK (gender IN ('MALE', 'FEMALE')),
    date_of_birth         DATE,
    address               VARCHAR(300),
    chronic_diseases      VARCHAR(1000),
    allergies             VARCHAR(1000),
    current_medications   VARCHAR(1000),
    previous_surgeries    VARCHAR(1000),
    notes                 VARCHAR(1000),
    created_at            TIMESTAMP NOT NULL DEFAULT now(),
    updated_at            TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_patients_phone ON patients (phone);
CREATE INDEX idx_patients_email ON patients (email);

CREATE TABLE appointments (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id        UUID NOT NULL REFERENCES patients (id),
    doctor_id         UUID NOT NULL REFERENCES doctors (id),
    specialty_id      UUID NOT NULL REFERENCES specialties (id),
    appt_date         DATE NOT NULL,
    start_time        TIME NOT NULL,
    end_time          TIME NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING_OTP'
                        CHECK (status IN ('PENDING_OTP', 'CONFIRMED', 'WAITING', 'IN_EXAM',
                                           'COMPLETED', 'CANCELLED', 'EMERGENCY')),
    reason_for_visit  VARCHAR(500),
    queue_number      INTEGER,
    checked_in_at     TIMESTAMP,
    started_at        TIMESTAMP,
    completed_at      TIMESTAMP,
    is_emergency      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMP NOT NULL DEFAULT now(),
    updated_at        TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_doctor_date ON appointments (doctor_id, appt_date);
CREATE INDEX idx_appointments_patient_id ON appointments (patient_id);
CREATE INDEX idx_appointments_status ON appointments (status);

CREATE TABLE users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name         VARCHAR(150) NOT NULL,
    username          VARCHAR(60) NOT NULL UNIQUE,
    password_hash     VARCHAR(100) NOT NULL,
    role              VARCHAR(20) NOT NULL
                        CHECK (role IN ('ADMIN', 'RECEPTION', 'DOCTOR', 'PHARMACY', 'LAB')),
    linked_doctor_id  UUID REFERENCES doctors (id),
    active            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP NOT NULL DEFAULT now(),
    updated_at        TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_linked_doctor_id ON users (linked_doctor_id);
