import React from "react";
import Link from "next/link";
import { requireUser, requireStaffRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase";

export default async function StaffPage() {
  const user = await requireUser();
  requireStaffRole(user, ["nurse", "radiologist", "doctor"]);

  const sb = supabaseAdmin();
  const staffId = user.staff.id;

  const { data: myAssignments } = await sb
    .from("assignments")
    .select("id,service_type,status,notes,created_at,patient_id,patients(name)")
    .or(`nurse_id.eq.${staffId},radiologist_id.eq.${staffId},doctor_id.eq.${staffId}`)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: patients } = await sb.from("patients").select("id,name").order("created_at", { ascending: false }).limit(200);

  return (
    <div className="container">
      <div className="nav">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/dashboard">← Back</Link>
          <strong>Staff Workspace</strong>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Add report / scan result</h3>
          <p><small className="muted">Nurses, radiologists, and physicians can attach bedside notes, imaging PDFs, or cloud scans directly to the chart.</small></p>
          <form action="/api/staff/add-report" method="post" className="grid" encType="multipart/form-data">
            <div className="grid grid-2">
              <div>
                <label>Patient</label>
                <select name="patient_id" required>
                  {(patients ?? []).map((p:any) => <option key={p.id} value={p.id}>{p.name} (#{p.id})</option>)}
                </select>
              </div>
              <div>
                <label>Report Type</label>
                <input name="report_type" placeholder="Nursing Note / Radiology Result / ECG Result" required />
              </div>
            </div>
            <div>
              <label>Summary</label>
              <textarea name="summary" rows={4} placeholder="Vitals, impressions, recommendations" required />
            </div>
            <div className="grid grid-2">
              <div>
                <label>Upload image (PNG, JPG, PDF)</label>
                <input name="file" type="file" accept="image/png,image/jpeg,application/pdf" />
                <small className="muted">Attach a bedside photo, scan export, or signed note. Files are stored securely.</small>
              </div>
              <div>
                <label>Attachment / scan URL (optional)</label>
                <input name="file_url" placeholder="https://drive.google.com/... or https://pacs/hospital-scan" />
                <small className="muted">Use a secure viewer link when needed; otherwise upload the file above.</small>
              </div>
            </div>
            <div className="grid grid-2" style={{ alignItems: "end" }}>
              <div>
                <label>Your role on this upload</label>
                <input name="role_hint" defaultValue={user.staff.role} readOnly />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="submit">Add Report</button>
              </div>
            </div>
            <small className="muted">Doctors will see this in patient history. Uploads and links are both supported.</small>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>My Assigned Work</h3>
          {(!myAssignments || myAssignments.length === 0) ? (
            <p><small className="muted">No assignments yet.</small></p>
          ) : (
            <table className="table">
              <thead><tr><th>Patient</th><th>Service</th><th>Status</th><th>Notes</th></tr></thead>
              <tbody>
                {myAssignments.map((a:any) => (
                  <tr key={a.id}>
                    <td>{a.patients?.name ?? a.patient_id}</td>
                    <td>{a.service_type}</td>
                    <td>{a.status}</td>
                    <td>{a.notes ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
