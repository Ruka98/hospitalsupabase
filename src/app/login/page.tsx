import React from "react";

const roleHighlights = [
  { title: "Doctors", detail: "Order investigations, assign nurses & radiologists, review timelines." },
  { title: "Nurses & Radiology", detail: "Upload bedside notes, scan findings, and attach imaging links." },
  { title: "Patients", detail: "Track your services, reports, and attachments in one place." }
];

export default function LoginPage() {
  return (
    <div className="container" style={{ maxWidth: 960, paddingTop: 60 }}>
      <div className="grid grid-2" style={{ alignItems: "stretch" }}>
        <div className="card" style={{ background: "linear-gradient(145deg, #f1f5ff, #ffffff)", borderColor: "#d7e3ff" }}>
          <p className="badge emphasis">Hospital Command Center</p>
          <h1 className="hero-title">Sign in to care smarter.</h1>
          <p className="hero-subtitle">Role-aware workspace for doctors, nurses, radiologists, and patients with instant notifications.</p>

          <div className="grid" style={{ marginTop: 18 }}>
            {roleHighlights.map((item) => (
              <div key={item.title} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div className="badge emphasis" aria-hidden>
                  <span role="img" aria-label="spark">⚡</span>
                  {item.title}
                </div>
                <div>
                  <strong>{item.title}</strong>
                  <p style={{ margin: "4px 0 0", color: "#475467" }}>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18 }}>
            <small className="muted">Tip: Use your department username and password. Staff access drives role-specific navigation.</small>
          </div>
        </div>

        <div className="card" style={{ backdropFilter: "blur(4px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <h2 style={{ margin: 0 }}>Welcome back</h2>
            <span className="badge">Secure login</span>
          </div>
          <p><small className="muted">Choose your portal and sign in to manage assignments, reports, and patient updates.</small></p>
          <form action="/api/auth/login" method="post" className="grid">
            <div className="grid grid-2">
              <div>
                <label>User Type</label>
                <select name="userType" defaultValue="staff" required>
                  <option value="staff">Staff (Doctor/Nurse/Radiology/Admin)</option>
                  <option value="patient">Patient</option>
                </select>
              </div>
              <div>
                <label>Department Role</label>
                <input name="department_hint" placeholder="e.g. Cardiology, Radiology" aria-label="Department" />
              </div>
            </div>
            <div>
              <label>Username</label>
              <input name="username" placeholder="e.g. dr_smith" required />
            </div>
            <div>
              <label>Password</label>
              <input name="password" type="password" placeholder="••••••••" required />
            </div>
            <button type="submit">Enter workspace</button>
            <p><small className="muted">No Supabase Auth used — this app uses custom sessions stored securely in the database.</small></p>
          </form>
        </div>
      </div>
    </div>
  );
}
