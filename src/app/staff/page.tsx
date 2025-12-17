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
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/dashboard">← Back</Link>
          <strong>Staff Workspace</strong>
        </div>
      </div>

      <div className="grid grid-2">
        <StaffReportForm patients={patients || []} userRole={user.staff.role} />

        <div className="card">
          <div className="section-header">
            <h3>My Assignments</h3>
            <span className="badge">{myAssignments?.length || 0} Tasks</span>
          </div>

          {(!myAssignments || myAssignments.length === 0) ? (
            <div style={{textAlign: "center", padding: "2rem 0", color: "var(--muted)"}}>
              <p>No active assignments.</p>
            </div>
          ) : (
            <div className="grid">
              {myAssignments.map((a:any) => (
                <div key={a.id} style={{ border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1rem", background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "0.5rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <strong style={{ fontSize: "1rem" }}>{a.patients?.name ?? `Patient #${a.patient_id}`}</strong>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <span className="badge">{a.service_type}</span>
                        <span className={`badge ${a.status === 'completed' ? 'success' : a.status === 'in_progress' ? 'emphasis' : ''}`}>
                          {a.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ margin: "0.5rem 0", fontSize: "0.875rem", color: "var(--muted)" }}>
                    {a.notes ? (
                      <div style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "0.5rem", borderRadius: "0.5rem" }}>
                        <strong>Instructions:</strong> {a.notes}
                      </div>
                    ) : (
                      <em>No specific instructions.</em>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
                     <small className="muted">Assigned by: {a.doctor?.name ?? "Doctor"}</small>
                  </div>

                  <form action="/api/staff/update-assignment" method="post" style={{ marginTop: "1rem" }}>
                    <input type="hidden" name="assignment_id" value={a.id} />
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <select name="status" defaultValue={a.status} style={{ flex: 1 }}>
                          <option value="assigned">Assigned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button type="submit" className="secondary" style={{ whiteSpace: "nowrap" }}>Update</button>
                    </div>
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
