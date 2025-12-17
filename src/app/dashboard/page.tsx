import React from "react";
import Link from "next/link";
import { requireUser } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase";

function RoleBadge({ text }: { text: string }) {
  return <span className="badge">{text}</span>;
}

export default async function Dashboard() {
  const user = await requireUser();
  const sb = supabaseAdmin();

  let notifications: any[] = [];
  if (user.userType === "staff") {
    const { data } = await sb
      .from("notifications")
      .select("id,title,message,is_read,created_at,related_assignment_id")
      .eq("recipient_staff_id", user.staff.id)
      .order("created_at", { ascending: false })
      .limit(10);
    notifications = data ?? [];
  }

  return (
    <div className="container">
      <div className="nav">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <strong>Hospital Management System</strong>
          {user.userType === "staff" ? <RoleBadge text={user.staff.role} /> : <RoleBadge text="patient" />}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/dashboard">Dashboard</Link>
          {user.userType === "staff" && user.staff.role === "admin" && <Link href="/admin">Admin</Link>}
          {user.userType === "staff" && user.staff.role === "doctor" && <Link href="/doctor">Doctor</Link>}
          {user.userType === "staff" && (user.staff.role === "nurse" || user.staff.role === "radiologist") && <Link href="/staff">Staff</Link>}
          {user.userType === "patient" && <Link href="/patient">Patient</Link>}
          <form action="/api/auth/logout" method="post">
            <button className="secondary" type="submit">Logout</button>
          </form>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Welcome</h3>
          {user.userType === "staff" ? (
            <>
              <p><strong>{user.staff.name}</strong></p>
              <p><small className="muted">Role: {user.staff.role}{user.staff.category ? ` • ${user.staff.category}` : ""}</small></p>
            </>
          ) : (
            <>
              <p><strong>{user.patient.name}</strong></p>
              <p><small className="muted">Patient Portal</small></p>
            </>
          )}
          <p><small className="muted">Use the top navigation to access your functions.</small></p>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Notifications</h3>
          {user.userType !== "staff" ? (
            <p><small className="muted">Notifications are for staff assignments.</small></p>
          ) : notifications.length === 0 ? (
            <p><small className="muted">No notifications.</small></p>
          ) : (
            <div className="grid">
              {notifications.map((n) => (
                <div key={n.id} style={{ border: "1px solid #eef0f6", borderRadius: 12, padding: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <strong>{n.title}</strong>
                    <span className="badge">{n.is_read ? "read" : "new"}</span>
                  </div>
                  <div><small className="muted">{new Date(n.created_at).toLocaleString()}</small></div>
                  <p style={{ marginBottom: 8 }}>{n.message}</p>
                  {!n.is_read && (
                    <form action="/api/notifications/mark-read" method="post">
                      <input type="hidden" name="id" value={n.id} />
                      <button className="secondary" type="submit">Mark as read</button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
