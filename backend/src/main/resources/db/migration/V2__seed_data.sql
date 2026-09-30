-- MindCare backend — demo seed data
-- Mirrors the exact demo dataset the client-side (IndexedDB) build seeds on
-- first launch (see src/app/core/data/seed.service.ts), so the backend and
-- the fully-static frontend demo show the same specialties/doctors/accounts.

-- ---------- Specialties ----------
INSERT INTO specialties (id, name_ar, name_en, icon, active) VALUES
  ('ca3a2ed3-aa95-41e1-bca6-17c5b79b8508', 'باطنة عامة',   'Internal Medicine',          'bi-heart-pulse',    TRUE),
  ('5bf7218e-ebc4-4b99-999c-e011309ecca4', 'أطفال',        'Pediatrics',                 'bi-emoji-smile',    TRUE),
  ('7a5ae2ab-5096-4d1f-8176-414447a79c19', 'جلدية',        'Dermatology',                'bi-bandaid',        TRUE),
  ('d788d202-e6e5-4604-9da2-c89b49b8084e', 'عظام',         'Orthopedics',                'bi-bone',           TRUE),
  ('454eb935-7273-4ec8-917b-4944bd40edbd', 'نساء وتوليد',  'Obstetrics & Gynecology',    'bi-gender-female',  TRUE),
  ('a5a7b3b4-aecb-49c9-af23-a637cd50d1fa', 'أسنان',        'Dentistry',                  'bi-emoji-laughing', TRUE);

-- ---------- Doctors ----------
INSERT INTO doctors (id, full_name, gender, specialty_id, title, bio, avatar_color,
                      consultation_fee, rating, rating_count, years_experience, active) VALUES
  ('57473930-1ded-4b5a-943e-52fb5c374e91', 'د. أحمد المصري', 'MALE',
    'ca3a2ed3-aa95-41e1-bca6-17c5b79b8508', 'استشاري', 'استشاري د. أحمد المصري بخبرة 18 عامًا في مجال التخصص.',
    '#0f7d8c', 300, 4.8, 214, 18, TRUE),
  ('ef6eced8-9ef6-4f7d-99d8-3876e755cf53', 'د. سارة عبد الله', 'FEMALE',
    '5bf7218e-ebc4-4b99-999c-e011309ecca4', 'أخصائي', 'أخصائي د. سارة عبد الله بخبرة 11 عامًا في مجال التخصص.',
    '#2a9d8f', 250, 4.9, 341, 11, TRUE),
  ('9d12ab7b-81de-4db3-a4f3-84fddbb7951b', 'د. محمد سمير', 'MALE',
    '7a5ae2ab-5096-4d1f-8176-414447a79c19', 'استشاري', 'استشاري د. محمد سمير بخبرة 14 عامًا في مجال التخصص.',
    '#3b82c4', 350, 4.6, 156, 14, TRUE),
  ('fca735c6-48ab-435f-9af0-5ffa7d7ddff4', 'د. نورهان فتحي', 'FEMALE',
    'd788d202-e6e5-4604-9da2-c89b49b8084e', 'أخصائي', 'أخصائي د. نورهان فتحي بخبرة 9 أعوام في مجال التخصص.',
    '#8a5cf5', 280, 4.7, 98, 9, TRUE),
  ('41e762b0-a518-4668-9104-712d42eb821c', 'د. هبة كمال', 'FEMALE',
    '454eb935-7273-4ec8-917b-4944bd40edbd', 'استشاري', 'استشاري د. هبة كمال بخبرة 16 عامًا في مجال التخصص.',
    '#e6a417', 320, 4.9, 402, 16, TRUE),
  ('1e9bddf2-10b4-4a0d-8b54-628385732896', 'د. كريم عادل', 'MALE',
    'a5a7b3b4-aecb-49c9-af23-a637cd50d1fa', 'أخصائي', 'أخصائي د. كريم عادل بخبرة 7 أعوام في مجال التخصص.',
    '#d64545', 200, 4.5, 87, 7, TRUE);

-- ---------- Doctor shifts (0 = Sunday .. 6 = Saturday, matches the frontend convention) ----------
INSERT INTO doctor_shifts (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes)
SELECT '57473930-1ded-4b5a-943e-52fb5c374e91'::uuid, d, '09:00'::time, '15:00'::time, 15 FROM unnest(ARRAY[0,1,2,3]) AS d
UNION ALL
SELECT 'ef6eced8-9ef6-4f7d-99d8-3876e755cf53'::uuid, d, '10:00'::time, '18:00'::time, 15 FROM unnest(ARRAY[0,2,4]) AS d
UNION ALL
SELECT '9d12ab7b-81de-4db3-a4f3-84fddbb7951b'::uuid, d, '12:00'::time, '20:00'::time, 15 FROM unnest(ARRAY[1,3,5]) AS d
UNION ALL
SELECT 'fca735c6-48ab-435f-9af0-5ffa7d7ddff4'::uuid, d, '09:00'::time, '14:00'::time, 15 FROM unnest(ARRAY[0,1,3,4]) AS d
UNION ALL
SELECT '41e762b0-a518-4668-9104-712d42eb821c'::uuid, d, '11:00'::time, '19:00'::time, 15 FROM unnest(ARRAY[0,2,3,5]) AS d
UNION ALL
SELECT '1e9bddf2-10b4-4a0d-8b54-628385732896'::uuid, d, '10:00'::time, '17:00'::time, 15 FROM unnest(ARRAY[1,2,4,6]) AS d;

-- ---------- Demo patients ----------
INSERT INTO patients (id, full_name, phone, email, gender) VALUES
  ('a8a4d0a5-4a0d-408d-8548-de86e3ed7e49', 'ياسمين علي', '01011122233', 'yasmin.demo@example.com', 'FEMALE'),
  ('44c71e02-4903-4089-b6a3-892a0c689ccc', 'عمر حسن',    '01099988877', 'omar.demo@example.com',   'MALE');

-- ---------- Staff accounts ----------
-- Same demo usernames/passwords as the client-side-only build, now backed by
-- real BCrypt hashes instead of the plaintext used in the IndexedDB demo.
--   admin / admin123        reception / reception123
--   pharmacy / pharmacy123  lab / lab123
--   doctor1..doctor6 / doctor123 (linked 1:1 to the doctors above)
INSERT INTO users (full_name, username, password_hash, role, linked_doctor_id, active) VALUES
  ('مدير النظام',    'admin',     '$2b$10$xJq5T/.xCs3smMiAfXiLbuOq/IowcM/aagN/B7HSeVCLrG2kWkrOO', 'ADMIN',     NULL, TRUE),
  ('موظف الاستقبال', 'reception', '$2b$10$HqL9qAF1yThbDZmvrJYmw.DqMVdwRtGnduQLD0i5OFLqKbzQkG9JG', 'RECEPTION', NULL, TRUE),
  ('الصيدلية',       'pharmacy',  '$2b$10$ym5U1jbUXSNT1oGPBqeXy.Q8.TF63f0MR960GBBBlULaEqIo9HOz.', 'PHARMACY',  NULL, TRUE),
  ('المعمل',         'lab',       '$2b$10$eYZbi5nW9Pa07IbopRWN7.qlIzUzl9upYx1jXWsOpcPCtT41xMsfC', 'LAB',       NULL, TRUE),
  ('د. أحمد المصري',  'doctor1',   '$2b$10$7s2AyS1oe8UrLqPzfaytIeE.YTA4PzTO2S/B2LcIMOB0w0rBaxvLe', 'DOCTOR', '57473930-1ded-4b5a-943e-52fb5c374e91', TRUE),
  ('د. سارة عبد الله', 'doctor2',  '$2b$10$7s2AyS1oe8UrLqPzfaytIeE.YTA4PzTO2S/B2LcIMOB0w0rBaxvLe', 'DOCTOR', 'ef6eced8-9ef6-4f7d-99d8-3876e755cf53', TRUE),
  ('د. محمد سمير',    'doctor3',  '$2b$10$7s2AyS1oe8UrLqPzfaytIeE.YTA4PzTO2S/B2LcIMOB0w0rBaxvLe', 'DOCTOR', '9d12ab7b-81de-4db3-a4f3-84fddbb7951b', TRUE),
  ('د. نورهان فتحي',  'doctor4',  '$2b$10$7s2AyS1oe8UrLqPzfaytIeE.YTA4PzTO2S/B2LcIMOB0w0rBaxvLe', 'DOCTOR', 'fca735c6-48ab-435f-9af0-5ffa7d7ddff4', TRUE),
  ('د. هبة كمال',     'doctor5',  '$2b$10$7s2AyS1oe8UrLqPzfaytIeE.YTA4PzTO2S/B2LcIMOB0w0rBaxvLe', 'DOCTOR', '41e762b0-a518-4668-9104-712d42eb821c', TRUE),
  ('د. كريم عادل',    'doctor6',  '$2b$10$7s2AyS1oe8UrLqPzfaytIeE.YTA4PzTO2S/B2LcIMOB0w0rBaxvLe', 'DOCTOR', '1e9bddf2-10b4-4a0d-8b54-628385732896', TRUE);
