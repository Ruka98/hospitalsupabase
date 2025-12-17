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
          <p><small className="muted">Nurses, radiologists, and physicians can attach bedside notes, imaging PDFs, or cloud scan links directly to the chart.</small></p>
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
                <input name="report_type" placeholder="Nursing Note / Radiology Result / ECG Result" required />
              </div>
            </div>
            <div>
              <label>Summary</label>
              <textarea name="summary" rows={4} placeholder="Vitals, impressions, recommendations" required />
            </div>
            <div className="grid grid-2">
              <div>
                <label>Attachment / scan URL</label>
                <input name="file_url" placeholder="https://drive.google.com/... or https://pacs/hospital-scan" />
                <small className="muted">Paste an image, PDF, or secure viewer link for the scan.</small>
              </div>
              <div>
                <label>Your role on this upload</label>
                <input name="role_hint" defaultValue={user.staff.role} readOnly />
              </div>
            </div>
            <button type="submit">Add Report</button>
            <small className="muted">Doctors will see this in patient history.</small>
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
