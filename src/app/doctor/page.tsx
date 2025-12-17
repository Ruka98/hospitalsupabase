import React from "react";
import Link from "next/link";
import { requireUser, requireStaffRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase";

export default async function DoctorPage() {
  const user = await requireUser();
  requireStaffRole(user, ["doctor"]);

  const sb = supabaseAdmin();
  const { data: patients } = await sb.from("patients").select("id,name,age,gender,phone").order("created_at", { ascending: false }).limit(100);
  const { data: nurses } = await sb.from("staff").select("id,name,category,is_available").eq("role", "nurse").eq("is_available", true).order("created_at", { ascending: false });
  const { data: radiologists } = await sb.from("staff").select("id,name,category,is_available").eq("role", "radiologist").eq("is_available", true).order("created_at", { ascending: false });

  const { data: assignments } = await sb
    .from("assignments")
    .select("id,service_type,status,created_at,patient_id,doctor_id,nurse_id,radiologist_id,patients(name),staff!assignments_nurse_id_fkey(name),staff!assignments_radiologist_id_fkey(name)")
    .eq("doctor_id", user.staff.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="container">
      <div className="nav">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/dashboard">← Back</Link>
          <strong>Doctor Panel</strong>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="grid">
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Assign Patient to Staff</h3>
            <p><small className="muted">Assign a nurse or radiologist and they will be notified instantly.</small></p>
            <form action="/api/doctor/create-assignment" method="post" className="grid">
              <div>
                <label>Patient</label>
                <select name="patient_id" required>
                  {(patients ?? []).map((p:any) => <option key={p.id} value={p.id}>{p.name} (#{p.id})</option>)}
                </select>
              </div>

              <div className="grid grid-2">
                <div>
                  <label>Service Type</label>
                  <input name="service_type" placeholder="ECG / Cardio / X-Ray / CT ..." required />
                </div>
                <div>
                  <label>Status</label>
                  <select name="status" defaultValue="assigned">
                    <option value="assigned">assigned</option>
                    <option value="in_progress">in_progress</option>
                    <option value="done">done</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-2">
                <div>
                  <label>Nurse (optional, available only)</label>
                  <select name="nurse_id" defaultValue="">
                    <option value="">None</option>
                    {(nurses ?? []).map((s:any) => <option key={s.id} value={s.id}>{s.name}{s.category ? ` • ${s.category}` : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label>Radiologist (optional, available only)</label>
                  <select name="radiologist_id" defaultValue="">
                    <option value="">None</option>
                    {(radiologists ?? []).map((s:any) => <option key={s.id} value={s.id}>{s.name}{s.category ? ` • ${s.category}` : ""}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label>Notes (optional)</label>
                <textarea name="notes" rows={3} placeholder="Any clinical notes for staff..." />
              </div>

              <button type="submit">Create Assignment</button>
              <small className="muted">Assigned nurse/radiologist will receive a notification.</small>
            </form>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Document & upload</h3>
            <p><small className="muted">Add a clinical note, scan link, or imaging report directly to the patient record.</small></p>
            <form action="/api/staff/add-report" method="post" className="grid">
              <div className="grid grid-2">
                <div>
                  <label>Patient</label>
                  <select name="patient_id" required>
                    {(patients ?? []).map((p:any) => <option key={p.id} value={p.id}>{p.name} (#{p.id})</option>)}
                  </select>
                </div>
                <div>
                  <label>Report Type</label>
                  <input name="report_type" placeholder="Clinical note / Imaging / Scan" required />
                </div>
              </div>
              <div>
                <label>Summary</label>
                <textarea name="summary" rows={4} placeholder="Key findings, impressions, or bedside updates" required />
              </div>
              <div>
                <label>Attachment or scan URL</label>
                <input name="file_url" placeholder="Paste image, PDF, or cloud drive link to the scan" />
                <small className="muted">Use any secure file URL (PACS viewer, Drive, etc.).</small>
              </div>
              <button type="submit">Save report to chart</button>
            </form>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>View Patient History</h3>
          <form action="/patient-history" method="get" className="grid">
            <div>
              <label>Patient</label>
              <select name="patient_id" required>
                {(patients ?? []).map((p:any) => <option key={p.id} value={p.id}>{p.name} (#{p.id})</option>)}
              </select>
            </div>
            <button type="submit">Open History</button>
          </form>

          <div style={{ marginTop: 14 }}>
            <h4 style={{ margin: 0 }}>Your Recent Assignments</h4>
            <table className="table" style={{ marginTop: 8 }}>
              <thead><tr><th>Patient</th><th>Service</th><th>Status</th><th>Nurse</th><th>Radiologist</th></tr></thead>
              <tbody>
                {(assignments ?? []).map((a:any) => (
                  <tr key={a.id}>
                    <td>{a.patients?.name ?? a.patient_id}</td>
                    <td>{a.service_type}</td>
                    <td>{a.status}</td>
                    <td>{a["staff"]?.name ?? "-"}</td>
                    <td>{a["staff!assignments_radiologist_id_fkey"]?.name ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
