import React from "react";
import Link from "next/link";
import { requireUser, requireStaffRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase";
import StaffReportForm from "./StaffReportForm";

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
        <StaffReportForm patients={patients || []} userRole={user.staff.role} />

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
