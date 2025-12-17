-- Run this in Supabase SQL Editor

-- Enable required extension (optional but useful)
-- create extension if not exists "uuid-ossp";

-- STAFF + PATIENTS
create table if not exists staff (
  id bigserial primary key,
  name text not null,
  role text not null check (role in ('admin','doctor','nurse','radiologist')),
  category text,
  username text not null unique,
  password_hash text not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists patients (
  id bigserial primary key,
  name text not null,
  age integer,
  gender text,
  phone text,
  address text,
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- Assignments: doctor -> patient + optional nurse/radiologist + service type (ECG, Cardio, etc.)
create table if not exists assignments (
  id bigserial primary key,
  patient_id bigint not null references patients(id) on delete cascade,
  doctor_id bigint not null references staff(id) on delete restrict,
  nurse_id bigint references staff(id) on delete set null,
  radiologist_id bigint references staff(id) on delete set null,
  service_type text not null, -- e.g., 'ECG', 'Cardio', 'X-Ray', 'CT'
  status text not null default 'assigned' check (status in ('assigned','in_progress','done','cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

-- Reports: nurses/radiologists can add; doctors can view history
create table if not exists reports (
  id bigserial primary key,
  patient_id bigint not null references patients(id) on delete cascade,
  created_by_staff_id bigint references staff(id) on delete set null,
  report_type text not null, -- e.g., 'Nursing Note', 'Radiology Result', 'ECG Result'
  summary text not null,
  file_url text, -- since "tables only", store a link (Drive, OneDrive, etc.) instead of Storage
  created_at timestamptz not null default now()
);

-- Notifications for staff (e.g., doctor assigns a radiologist/nurse)
create table if not exists notifications (
  id bigserial primary key,
  recipient_staff_id bigint not null references staff(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  related_assignment_id bigint references assignments(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Sessions (custom auth)
create table if not exists sessions (
  id bigserial primary key,
  token_hash text not null unique,
  user_type text not null check (user_type in ('staff','patient')),
  staff_id bigint references staff(id) on delete cascade,
  patient_id bigint references patients(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_expires on sessions(expires_at);
create index if not exists idx_notifications_recipient on notifications(recipient_staff_id, is_read);
create index if not exists idx_reports_patient on reports(patient_id, created_at);
create index if not exists idx_assignments_patient on assignments(patient_id, created_at);
