import React from "react";

export default function LoginPage() {
  return (
    <div className="container" style={{ maxWidth: 520, paddingTop: 60 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Login</h2>
        <p><small className="muted">Login as Staff (Admin/Doctor/Nurse/Radiologist) or as Patient using your username & password.</small></p>
        <form action="/api/auth/login" method="post" className="grid">
          <div>
            <label>User Type</label>
            <select name="userType" defaultValue="staff">
              <option value="staff">Staff</option>
              <option value="patient">Patient</option>
            </select>
          </div>
          <div>
            <label>Username</label>
            <input name="username" placeholder="e.g. admin" required />
          </div>
          <div>
            <label>Password</label>
            <input name="password" type="password" placeholder="••••••••" required />
          </div>
          <button type="submit">Sign in</button>
          <p><small className="muted">No Supabase Auth used — this app uses custom sessions stored in the database.</small></p>
        </form>
      </div>
    </div>
  );
}
