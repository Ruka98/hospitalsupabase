import React from "react";
import Link from "next/link";
import { requireUser, requireStaffRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase";
import StaffReportForm from "../staff/StaffReportForm"; // Reuse the form for uploads

export default async function DoctorPage() {
  const user = await requireUser();
  requireStaffRole(user, ["doctor"]);

  const sb = supabaseAdmin();
  const { data: patients } = await sb.from("patients").select("id,name,age,gender,phone").order("created_at", { ascending: false }).limit(100);
  const { data: nurses } = await sb.from("staff").select("id,name,category,is_available").eq("role", "nurse").eq("is_available", true).order("created_at", { ascending: false });
  const { data: radiologists } = await sb.from("staff").select("id,name,category,is_available").eq("role", "radiologist").eq("is_available", true).order("created_at", { ascending: false });
  const { data: labStaff } = await sb.from("staff").select("id,name,category,is_available").eq("role", "lab").eq("is_available", true).order("created_at", { ascending: false });
  const { data: pharmacists } = await sb.from("staff").select("id,name,category,is_available").eq("role", "pharmacist").eq("is_available", true).order("created_at", { ascending: false });

  const { data: assignments } = await sb
    .from("assignments")
    .select(`
      id,service_type,status,created_at,patient_id,doctor_id,nurse_id,radiologist_id,lab_staff_id,pharmacist_id,notes,
      patients(name),
      doctor:staff!assignments_doctor_id_fkey(name),
      nurse:staff!assignments_nurse_id_fkey(name),
      radiologist:staff!assignments_radiologist_id_fkey(name),
      lab:staff!assignments_lab_staff_id_fkey(name),
      pharmacist:staff!assignments_pharmacist_id_fkey(name)
    `)
    .eq("doctor_id", user.staff.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="container">
      <div className="nav">
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/dashboard">← Back</Link>
          <strong>Doctor Workspace</strong>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="grid">
          <div className="card">
            <h3>Assign Patient Task</h3>
            <p className="muted text-sm" style={{marginBottom: "1.5rem"}}>Delegate tasks to specialized staff members. They will be notified immediately.</p>
            <form action="/api/doctor/create-assignment" method="post" className="grid">
              <div>
                <label>Select Patient</label>
                <select name="patient_id" required>
                  <option value="">-- Select Patient --</option>
                  {(patients ?? []).map((p:any) => <option key={p.id} value={p.id}>{p.name} (#{p.id})</option>)}
                </select>
              </div>

              <div className="grid grid-2">
                <div>
                  <label>Service Type</label>
                  <input name="service_type" placeholder="e.g. ECG, X-Ray, Blood Test" required />
                </div>
                <div>
                  <label>Initial Status</label>
                  <select name="status" defaultValue="assigned">
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div style={{border: "1px solid #e2e8f0", padding: "1rem", borderRadius: "0.5rem", background: "#f8fafc"}}>
                <label style={{marginBottom: "0.5rem"}}>Assign To (Select at least one)</label>
                <div className="grid grid-2" style={{ gap: "1rem" }}>
                  <div>
                    <label className="text-sm muted">Nurse</label>
                    <select name="nurse_id" defaultValue="">
                      <option value="">None</option>
                      {(nurses ?? []).map((s:any) => <option key={s.id} value={s.id}>{s.name}{s.category ? ` • ${s.category}` : ""}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm muted">Radiologist</label>
                    <select name="radiologist_id" defaultValue="">
                      <option value="">None</option>
                      {(radiologists ?? []).map((s:any) => <option key={s.id} value={s.id}>{s.name}{s.category ? ` • ${s.category}` : ""}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm muted">Lab Staff</label>
                    <select name="lab_staff_id" defaultValue="">
                      <option value="">None</option>
                      {(labStaff ?? []).map((s:any) => <option key={s.id} value={s.id}>{s.name}{s.category ? ` • ${s.category}` : ""}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm muted">Pharmacist</label>
                    <select name="pharmacist_id" defaultValue="">
                      <option value="">None</option>
                      {(pharmacists ?? []).map((s:any) => <option key={s.id} value={s.id}>{s.name}{s.category ? ` • ${s.category}` : ""}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label>Clinical Notes / Instructions</label>
                <textarea name="notes" rows={3} placeholder="Add specific instructions, symptoms, or what to look for..." />
              </div>

              <button type="submit" style={{width: "100%"}}>Create Assignment & Notify Staff</button>
            </form>
          </div>

          {/* Reusing the StaffReportForm component for Doctors as well, since they also need to upload things */}
          <StaffReportForm patients={patients || []} userRole="doctor" />
        </div>

        <div className="grid" style={{alignContent: "start"}}>
          <div className="card">
            <h3>Patient Records</h3>
            <p className="muted text-sm" style={{marginBottom: "1rem"}}>View full history, past reports, and uploaded scans.</p>
            <form action="/patient-history" method="get" className="grid" style={{gap: "0.5rem"}}>
              <div style={{display: "flex", gap: "0.5rem"}}>
                <select name="patient_id" required style={{flex: 1}}>
                  <option value="">-- Select Patient to View History --</option>
                  {(patients ?? []).map((p:any) => <option key={p.id} value={p.id}>{p.name} (#{p.id})</option>)}
                </select>
                <button type="submit" className="secondary">Go</button>
              </div>
            </form>
          </div>

          <div className="card">
            <div className="section-header">
              <h3 style={{marginBottom: 0}}>Recent Assignments</h3>
            </div>
            {(!assignments || assignments.length === 0) ? (
              <p className="muted text-sm">No recent assignments found.</p>
            ) : (
              <div style={{overflowX: "auto"}}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Service</th>
                      <th>Status</th>
                      <th>Assigned To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(assignments).map((a:any) => {
                      const assignedTo = [
                        a.nurse?.name ? `Nurse: ${a.nurse.name}` : null,
                        a.radiologist?.name ? `Rad: ${a.radiologist.name}` : null,
                        a.lab?.name ? `Lab: ${a.lab.name}` : null,
                        a.pharmacist?.name ? `Pharm: ${a.pharmacist.name}` : null,
                      ].filter(Boolean).join(", ");

                      return (
                        <tr key={a.id}>
                          <td>{a.patients?.name ?? a.patient_id}</td>
                          <td>{a.service_type}</td>
                          <td>
                            <span className={`badge ${a.status === 'completed' ? 'success' : a.status === 'in_progress' ? 'emphasis' : ''}`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="text-sm muted">{assignedTo || "None"}</td>
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
    </div>
  );
}
