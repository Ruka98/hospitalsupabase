import React from "react";
import Link from "next/link";
import { requireUser, requireStaffRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase";
import StaffReportForm from "./StaffReportForm";

export default async function StaffPage() {
  const user = await requireUser();
  requireStaffRole(user, ["nurse", "radiologist", "doctor", "lab", "pharmacist"]);

  const sb = supabaseAdmin();
  const staffId = user.staff.id;

  const { data: myAssignments } = await sb
    .from("assignments")
    .select(`
      id,service_type,status,notes,created_at,patient_id,doctor_id,
      patients(name),
      doctor:staff!assignments_doctor_id_fkey(name)
    `)
    .or(`nurse_id.eq.${staffId},radiologist_id.eq.${staffId},doctor_id.eq.${staffId},lab_staff_id.eq.${staffId},pharmacist_id.eq.${staffId}`)
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
        <StaffReportForm patients={patients || []} userRole={user.staff.role} />

        <div className="card">
          <h3 style={{ marginTop: 0 }}>My Assigned Work</h3>
          {(!myAssignments || myAssignments.length === 0) ? (
            <p><small className="muted">No assignments yet.</small></p>
          ) : (
            <div className="grid">
              {myAssignments.map((a:any) => (
                <div key={a.id} style={{ border: "1px solid #eef0f6", borderRadius: 12, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <strong>{a.patients?.name ?? `Patient #${a.patient_id}`}</strong>
                      <span className="badge">{a.service_type}</span>
                    </div>
                    <span className="badge emphasis">{a.status}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                    <small className="muted">Assigned by: {a.doctor?.name ?? "Doctor"}</small>
                    {a.notes && <span className="badge">Instructions: {a.notes}</span>}
                  </div>

                  <form action="/api/staff/update-assignment" method="post" className="grid" style={{ marginTop: 10 }}>
                    <input type="hidden" name="assignment_id" value={a.id} />
                    <label style={{ fontWeight: 600 }}>Update status</label>
                    <div className="grid grid-2" style={{ alignItems: "center" }}>
                      <select name="status" defaultValue={a.status}>
                        <option value="assigned">assigned</option>
                        <option value="in_progress">in_progress</option>
                        <option value="completed">completed</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                      <button type="submit" className="secondary">Save status</button>
                    </div>
                    <small className="muted">Doctors are notified when you mark tasks as completed.</small>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
