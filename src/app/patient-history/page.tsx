import React from "react";
import Link from "next/link";
import { requireUser } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase";

export default async function PatientHistoryPage({ searchParams }: { searchParams: { patient_id?: string } }) {
  const user = await requireUser();
  if (user.userType !== "staff") {
    return <div className="container"><div className="card">Forbidden</div></div>;
  }

  const patientId = Number(searchParams.patient_id || 0);
  if (!patientId) {
    return (
      <div className="container">
        <div className="card">
          <Link href="/dashboard">← Back</Link>
          <p>Missing patient_id</p>
        </div>
      </div>
    );
  }

  const sb = supabaseAdmin();
  const { data: patient } = await sb.from("patients").select("id,name,age,gender,phone,address,created_at").eq("id", patientId).maybeSingle();
  const { data: assignments } = await sb
    .from("assignments")
    .select(`
      id,service_type,status,notes,created_at,doctor_id,nurse_id,radiologist_id,lab_staff_id,pharmacist_id,
      doctor:staff!assignments_doctor_id_fkey(name),
      nurse:staff!assignments_nurse_id_fkey(name),
      radiologist:staff!assignments_radiologist_id_fkey(name),
      lab:staff!assignments_lab_staff_id_fkey(name),
      pharmacist:staff!assignments_pharmacist_id_fkey(name)
    `)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  const { data: reports } = await sb
    .from("reports")
    .select("id,report_type,summary,file_url,created_at,created_by_staff_id,staff(name)")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  return (
    <div className="container">
      <div className="nav">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/doctor">← Back</Link>
          <strong>Patient History</strong>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>{patient?.name ?? "Patient"}</h2>
        <p><small className="muted">#{patientId} • {patient?.gender ?? "-"} • Age: {patient?.age ?? "-"}</small></p>
        <p><small className="muted">Phone: {patient?.phone ?? "-"} • Address: {patient?.address ?? "-"}</small></p>
      </div>

      <div className="grid grid-2" style={{ marginTop: 14 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Assignments</h3>
          {(!assignments || assignments.length === 0) ? (
            <p><small className="muted">No assignments yet.</small></p>
          ) : (
            <table className="table">
              <thead><tr><th>Service</th><th>Status</th><th>Doctor</th><th>Nurse</th><th>Radiologist</th><th>Lab</th><th>Pharmacy</th></tr></thead>
              <tbody>
                {assignments.map((a:any) => (
                  <tr key={a.id}>
                    <td>{a.service_type}</td>
                    <td><span className="badge">{a.status}</span></td>
                    <td>{a.doctor?.name ?? "-"}</td>
                    <td>{a.nurse?.name ?? "-"}</td>
                    <td>{a.radiologist?.name ?? "-"}</td>
                    <td>{a.lab?.name ?? "-"}</td>
                    <td>{a.pharmacist?.name ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Reports</h3>
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
                  </div>
                  <p style={{ marginTop: 8, marginBottom: 8 }}>{r.summary}</p>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span className="badge">By: {r.staff?.name ?? "Unknown"}</span>
                    {r.file_url ? <a className="badge" href={r.file_url} target="_blank" rel="noreferrer">Scan / attachment</a> : <small className="muted">No attachment</small>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
