# Hospital Management System (Next.js + Supabase Tables)

This is a **fully working** Hospital Management System built with:
- **Next.js (App Router)**
- **Supabase Postgres (tables only)** — *no Supabase Auth used*
- Custom login (username/password) + sessions stored in DB

## Features
### Admin
- Add Staff (Doctor / Nurse / Radiologist / Lab / Pharmacist / Admin)
- Add Patients
- View recent staff & patients

### Doctor
- Assign patients to **available** nurses, radiologists, lab staff, or pharmacists
- Choose service type (ECG, Cardio, X-Ray, Pharmacy request, etc.)
- View patient history (assignments + reports)

### Nurse / Radiologist / Lab
- View assigned work with ticket statuses (assigned → in progress → completed)
- Add reports / scan results to patient history (optional attachment URL)

### Pharmacist
- Receive prescription tasks from doctors
- Mark medicines as dispensed / completed for doctor visibility

### Patient
- Login and view assigned services + reports

### Notifications
- When doctor assigns a nurse/radiologist, they receive a notification.
- Staff can mark notifications as read.

---

## Setup

### 1) Create Supabase tables
Open Supabase Dashboard → SQL Editor → run:

- `supabase/schema.sql`

### 2) Configure environment variables
Copy:
- `.env.local.example` → `.env.local`

Fill:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_SESSION_SECRET`

### 3) Install & run
```bash
npm install
npm run dev
```

Open: http://localhost:3000

### 4) Seed initial admin (optional)
After setting `.env.local`, visit:
- http://localhost:3000/api/seed

Then login:
- userType: Staff
- username: admin (or your SEED_ADMIN_USERNAME)
- password: admin123 (or your SEED_ADMIN_PASSWORD)

> Important: Remove/disable `/api/seed` in production.

---

## Notes
- "Tables only" means attachments are saved as a URL in `reports.file_url`.
  If you later want file uploads, we can switch to Supabase Storage.
