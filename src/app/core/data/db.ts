import { DBSchema, IDBPDatabase, openDB } from 'idb';
import {
  Appointment,
  AppUser,
  Doctor,
  Invoice,
  LabOrder,
  LabTestType,
  Medicine,
  OtpChallenge,
  Patient,
  Prescription,
  Specialty,
} from '../models';

/**
 * MindCare persists everything client-side via IndexedDB.
 * This file is the single source of truth for the database schema —
 * the "infrastructure" layer of the Clean Architecture split
 * (domain models never import from here).
 */
export interface MindCareDbSchema extends DBSchema {
  specialties: { key: string; value: Specialty };
  doctors: { key: string; value: Doctor; indexes: { 'by-specialty': string } };
  patients: { key: string; value: Patient; indexes: { 'by-phone': string } };
  appointments: {
    key: string;
    value: Appointment;
    indexes: { 'by-doctor-date': [string, string]; 'by-status': string };
  };
  otpChallenges: { key: string; value: OtpChallenge };
  medicines: { key: string; value: Medicine };
  prescriptions: { key: string; value: Prescription; indexes: { 'by-appointment': string } };
  labTestTypes: { key: string; value: LabTestType };
  labOrders: { key: string; value: LabOrder; indexes: { 'by-status': string } };
  invoices: { key: string; value: Invoice };
  users: { key: string; value: AppUser; indexes: { 'by-username': string } };
}

export const DB_NAME = 'MindCare-db';
export const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MindCareDbSchema>> | null = null;

export function getDb(): Promise<IDBPDatabase<MindCareDbSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<MindCareDbSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('specialties', { keyPath: 'id' });

        const doctors = db.createObjectStore('doctors', { keyPath: 'id' });
        doctors.createIndex('by-specialty', 'specialtyId');

        const patients = db.createObjectStore('patients', { keyPath: 'id' });
        patients.createIndex('by-phone', 'phone');

        const appointments = db.createObjectStore('appointments', { keyPath: 'id' });
        appointments.createIndex('by-doctor-date', ['doctorId', 'date']);
        appointments.createIndex('by-status', 'status');

        db.createObjectStore('otpChallenges', { keyPath: 'id' });
        db.createObjectStore('medicines', { keyPath: 'id' });

        const prescriptions = db.createObjectStore('prescriptions', { keyPath: 'id' });
        prescriptions.createIndex('by-appointment', 'appointmentId');

        db.createObjectStore('labTestTypes', { keyPath: 'id' });

        const labOrders = db.createObjectStore('labOrders', { keyPath: 'id' });
        labOrders.createIndex('by-status', 'status');

        db.createObjectStore('invoices', { keyPath: 'id' });

        const users = db.createObjectStore('users', { keyPath: 'id' });
        users.createIndex('by-username', 'username');
      },
    });
  }
  return dbPromise;
}
