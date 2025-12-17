import React from "react";
import Link from "next/link";
import { requireUser } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase";

export default async function PatientHistoryPage({ searchParams }: { searchParams: Promise<{ patient_id?: string }> }) {
  const user = await requireUser();
  const { patient_id } = await searchParams;
  if (user.userType !== "staff") {
    return (
      <div className="container">
        <div className="card">
          <p style={{color: "var(--danger)"}}>Access Denied. Staff only.</p>
        </div>
      </div>
    );
  }

  const patientId = Number(patient_id || 0);
  if (!patientId) {
    return (
      <div className="container">
        <div className="card">
          <div style={{marginBottom: "1rem"}}>
             <Link href="/dashboard" className="secondary">← Back to Dashboard</Link>
          </div>
          <p>No patient selected.</p>
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

  if (!patient) {
      return (
        <div className="container">
            <div className="card">
                <Link href="/doctor">← Back</Link>
                <p>Patient not found.</p>
            </div>
        </div>
      );
  }

  return (
    <div className="container">
      <div className="nav">
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/doctor">← Back to Workspace</Link>
          <strong>Patient History Record</strong>
        </div>
      </div>

      <div className="card" style={{borderLeft: "4px solid var(--primary)"}}>
        <div style={{display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem"}}>
            <div>
                <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{patient.name}</h1>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", color: "var(--muted)", fontSize: "0.9rem" }}>
                    <span>ID: <strong>#{patient.id}</strong></span>
                    <span>Gender: <strong>{patient.gender ?? "N/A"}</strong></span>
                    <span>Age: <strong>{patient.age ?? "N/A"}</strong></span>
                </div>
            </div>
            <div style={{ textAlign: "right", color: "var(--muted)", fontSize: "0.9rem" }}>
                <div>Phone: {patient.phone ?? "N/A"}</div>
                <div>{patient.address ?? "No address provided"}</div>
            </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: "1.5rem" }}>
        <div className="card">
          <div className="section-header">
             <h3>Clinical Reports & Scans</h3>
             <span className="badge">{reports?.length || 0} Reports</span>
          </div>

          {(!reports || reports.length === 0) ? (
            <p className="muted text-sm">No clinical reports or scans recorded.</p>
          ) : (
            <div className="grid">
              {reports.map((r:any) => (
                <div key={r.id} style={{ border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1rem", background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <span className="badge emphasis">{r.report_type}</span>
                    <small className="muted">{new Date(r.created_at).toLocaleString()}</small>
                  </div>

                  <p style={{ margin: "0.75rem 0", lineHeight: "1.6", color: "var(--text)" }}>{r.summary}</p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.75rem", borderTop: "1px solid #e2e8f0" }}>
                    <div style={{display: "flex", gap: "0.5rem", alignItems: "center"}}>
                         <small className="muted">Recorded by:</small>
                         <span className="badge">{r.staff?.name ?? "Unknown Staff"}</span>
                    </div>
                    {r.file_url ? (
                        <a
                            className="button secondary"
                            href={r.file_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "0.25rem 0.75rem",
                                fontSize: "0.8rem",
                                border: "1px solid var(--primary)",
                                color: "var(--primary)",
                                borderRadius: "0.5rem",
                                background: "white"
                            }}
                        >
                            View Scan / File
                        </a>
                    ) : (
                        <small className="muted">No attachment</small>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-header">
            <h3>Care Plan & Assignments</h3>
            <span className="badge">{assignments?.length || 0} Tasks</span>
          </div>

          {(!assignments || assignments.length === 0) ? (
            <p className="muted text-sm">No assignments history.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
                <table className="table">
                <thead>
                    <tr>
                        <th>Service</th>
                        <th>Status</th>
                        <th>Assigned Staff</th>
                    </tr>
                </thead>
                <tbody>
                    {assignments.map((a:any) => {
                        const assignedList = [
                            a.nurse?.name ? `Nur: ${a.nurse.name}` : null,
                            a.radiologist?.name ? `Rad: ${a.radiologist.name}` : null,
                            a.lab?.name ? `Lab: ${a.lab.name}` : null,
                            a.pharmacist?.name ? `Phm: ${a.pharmacist.name}` : null,
                        ].filter(Boolean);

                        return (
                        <tr key={a.id}>
                            <td style={{fontWeight: 500}}>{a.service_type}</td>
                            <td>
                                <span className={`badge ${a.status === 'completed' ? 'success' : a.status === 'in_progress' ? 'emphasis' : ''}`}>
                                    {a.status}
                                </span>
                            </td>
                            <td className="text-sm muted">
                                {assignedList.length > 0 ? assignedList.join(", ") : "Pending Assignment"}
                                {a.doctor && <div style={{fontSize: "0.75rem", marginTop: "4px"}}>by Dr. {a.doctor.name}</div>}
                            </td>
                        </tr>
                        );
                    })}
                </tbody>
                </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
