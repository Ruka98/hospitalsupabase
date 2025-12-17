import React from "react";
import Link from "next/link";
import { requireUser, requireStaffRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase";

export default async function AdminPage() {
  const user = await requireUser();
  requireStaffRole(user, ["admin"]);

  const sb = supabaseAdmin();
  const { data: staff } = await sb.from("staff").select("id,name,role,category,username,is_available,created_at").order("created_at", { ascending: false }).limit(50);
  const { data: patients } = await sb.from("patients").select("id,name,age,gender,phone,username,created_at").order("created_at", { ascending: false }).limit(50);

  return (
    <div className="container">
      <div className="nav">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/dashboard">← Back</Link>
          <strong>Admin Panel</strong>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Add Staff</h3>
          <form action="/api/admin/add-staff" method="post" className="grid">
            <div className="grid grid-2">
              <div><label>Name</label><input name="name" required /></div>
              <div>
                <label>Role</label>
                <select name="role" defaultValue="doctor">
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="radiologist">Radiologist</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="grid grid-2">
              <div><label>Category (optional)</label><input name="category" placeholder="e.g. Cardiology" /></div>
              <div><label>Available</label>
                <select name="is_available" defaultValue="true">
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
            <div className="grid grid-2">
              <div><label>Username</label><input name="username" required /></div>
              <div><label>Password</label><input name="password" type="password" required /></div>
            </div>
            <button type="submit">Create Staff</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Add Patient</h3>
          <form action="/api/admin/add-patient" method="post" className="grid">
            <div className="grid grid-2">
              <div><label>Name</label><input name="name" required /></div>
              <div><label>Age</label><input name="age" type="number" min="0" /></div>
            </div>
            <div className="grid grid-2">
              <div><label>Gender</label><input name="gender" placeholder="Male/Female/Other" /></div>
              <div><label>Phone</label><input name="phone" /></div>
            </div>
            <div><label>Address</label><input name="address" /></div>
            <div className="grid grid-2">
              <div><label>Username</label><input name="username" required /></div>
              <div><label>Password</label><input name="password" type="password" required /></div>
            </div>
            <button type="submit">Create Patient</button>
          </form>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 14 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Recent Staff</h3>
          <table className="table">
            <thead><tr><th>Name</th><th>Role</th><th>Username</th><th>Available</th></tr></thead>
            <tbody>
              {(staff ?? []).map((s:any) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.role}{s.category ? ` • ${s.category}` : ""}</td>
                  <td>{s.username}</td>
                  <td>{String(s.is_available)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Recent Patients</h3>
          <table className="table">
            <thead><tr><th>Name</th><th>Age</th><th>Username</th><th>Phone</th></tr></thead>
            <tbody>
              {(patients ?? []).map((p:any) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.age ?? "-"}</td>
                  <td>{p.username}</td>
                  <td>{p.phone ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <small className="muted">Tip: Create doctors, nurses, radiologists here, then doctors can assign patients to available staff.</small>
      </div>
    </div>
  );
}
