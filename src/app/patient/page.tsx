import React from "react";
import Link from "next/link";
import { requireUser } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase";
import PatientUploadForm from "./PatientUploadForm";
import FileViewer from "@/components/FileViewer";

export default async function PatientPage() {
  const user = await requireUser();
  if (user.userType !== "patient") {
    // staff shouldn't use this page
    return (
      <div className="container">
        <div className="card"><p>Forbidden</p></div>
      </div>
    );
  }

  const sb = supabaseAdmin();

  const { data: assignments } = await sb
    .from("assignments")
    .select("id,service_type,status,notes,created_at,doctor_id,staff!assignments_doctor_id_fkey(name)")
    .eq("patient_id", user.patient.id)
    .order("created_at", { ascending: false });

  const { data: reports } = await sb
    .from("reports")
    .select("id,report_type,summary,file_url,created_at,created_by_staff_id,staff(name)")
    .eq("patient_id", user.patient.id)
    .order("created_at", { ascending: false });

  // Fetch patient uploads
  const { data: myUploads } = await sb
    .from("patient_uploads")
    .select("*")
    .eq("patient_id", user.patient.id)
    .order("created_at", { ascending: false });

  return (
    <div className="container">
      <div className="nav">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/dashboard">← Back</Link>
          <strong>Patient Portal</strong>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>My Clinic / Assigned Services</h3>
          {(!assignments || assignments.length === 0) ? (
            <p><small className="muted">No assigned services yet.</small></p>
          ) : (
            <table className="table">
              <thead><tr><th>Service</th><th>Status</th><th>Doctor</th><th>Notes</th></tr></thead>
              <tbody>
                {assignments.map((a:any) => (
                  <tr key={a.id}>
                    <td>{a.service_type}</td>
                    <td>{a.status}</td>
                    <td>{a["staff"]?.name ?? "-"}</td>
                    <td>{a.notes ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
            {/* New section for uploads */}
            <PatientUploadForm patientId={user.patient.id} />

            {myUploads && myUploads.length > 0 && (
                <div className="card" style={{ marginTop: 20 }}>
                    <h3 style={{ marginTop: 0 }}>My Personal Records</h3>
                    <div className="grid">
                    {myUploads.map((u:any) => (
                        <div key={u.id} style={{ border: "1px solid #eef0f6", borderRadius: 12, padding: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <strong>{u.title}</strong>
                                <small className="muted">{new Date(u.created_at).toLocaleDateString()}</small>
                            </div>
                            {u.description && <p style={{ fontSize: "0.9em", color: "#555" }}>{u.description}</p>}
                            <FileViewer url={u.file_url} type={u.file_type} label="View Record" />
                        </div>
                    ))}
                    </div>
                </div>
            )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Hospital Reports</h3>
          {(!reports || reports.length === 0) ? (
            <p><small className="muted">No reports yet.</small></p>
          ) : (
            <div className="grid">
              {reports.map((r:any) => (
                <div key={r.id} style={{ border: "1px solid #eef0f6", borderRadius: 12, padding: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span className="badge emphasis">{r.report_type}</span>
                      <small className="muted">{new Date(r.created_at).toLocaleString()}</small>
                    </div>
                    <small className="muted">By: {r.staff?.name ?? "Hospital staff"}</small>
                  </div>
                  <p style={{ marginTop: 8, marginBottom: 8 }}>{r.summary}</p>
                  <FileViewer url={r.file_url} label="Open scan / image" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
