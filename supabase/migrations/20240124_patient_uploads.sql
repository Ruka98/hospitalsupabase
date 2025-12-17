-- Create a table for patient-uploaded documents
create table if not exists patient_uploads (
  id bigserial primary key,
  patient_id bigint not null references patients(id) on delete cascade,
  title text not null,
  description text,
  file_url text not null,
  file_type text,
  created_at timestamptz not null default now()
);

create index if not exists idx_patient_uploads_patient on patient_uploads(patient_id, created_at);

-- Note: You need to create a storage bucket named 'uploads' (or ensure 'reports' is public/accessible) in Supabase Storage.
