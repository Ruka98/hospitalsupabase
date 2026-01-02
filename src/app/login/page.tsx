"use client";

import React, { useState } from "react";
import { supabaseClient } from "@/lib/supabase-client";

const roleHighlights = [
  { title: "Doctors", detail: "Order investigations, assign nurses & radiologists, review timelines." },
  { title: "Nurses & Radiology", detail: "Upload bedside notes, scan findings, and attach imaging links." },
  { title: "Patients", detail: "Track your services, reports, and attachments in one place." }
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (error) {
        alert("Error logging in with Google: " + error.message);
      }
    } catch (err: any) {
      alert("Unexpected error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-[960px] pt-[60px]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        <div className="card bg-gradient-to-br from-[#f1f5ff] to-white border-[#d7e3ff]">
          <p className="badge emphasis">Hospital Command Center</p>
          <h1 className="hero-title">Sign in to care smarter.</h1>
          <p className="hero-subtitle">Role-aware workspace for doctors, nurses, radiologists, and patients with instant notifications.</p>

          <div className="grid gap-4 mt-5">
            {roleHighlights.map((item) => (
              <div key={item.title} className="flex gap-2.5 items-start">
                <div className="badge emphasis" aria-hidden>
                  <span role="img" aria-label="spark">⚡</span>
                  {item.title}
                </div>
                <div>
                  <strong>{item.title}</strong>
                  <p className="m-0 mt-1 text-[#475467]">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <small className="muted">Tip: Use your department username and password. Staff access drives role-specific navigation.</small>
          </div>
        </div>

        <div className="card backdrop-blur-sm">
          <div className="flex justify-between items-center mb-1.5">
            <h2 className="m-0">Welcome back</h2>
            <span className="badge">Secure login</span>
          </div>
          <p><small className="muted">Choose your portal and sign in to manage assignments, reports, and patient updates.</small></p>

          <div className="mb-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-white text-[#333] border border-[#ccc] px-4 py-2 rounded hover:bg-gray-50 transition-colors"
            >
              {loading ? "Redirecting..." : (
                <>
                  <img src="https://www.google.com/favicon.ico" alt="Google" width="16" height="16" />
                  Sign in with Google
                </>
              )}
            </button>
            <div className="text-center my-3 text-[#666] text-sm">
              — or sign in with credentials —
            </div>
          </div>

          <form action="/api/auth/login" method="post" className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <p><small className="muted">Note: Google login requires your email to be registered in our system.</small></p>
          </form>
        </div>
      </div>
    </div>
  );
}
