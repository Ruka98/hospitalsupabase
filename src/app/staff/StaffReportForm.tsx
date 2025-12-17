"use client";

import React, { useState } from "react";
import UploadWidget from "@/components/UploadWidget";
import { useRouter } from "next/navigation";

interface StaffReportFormProps {
  patients: { id: number; name: string }[];
  userRole: string;
}

export default function StaffReportForm({ patients, userRole }: StaffReportFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    patient_id: "",
    report_type: "",
    summary: "",
    file_url: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const readyToSave = Boolean(formData.patient_id && formData.report_type && formData.summary);

  const handleUploadComplete = (url: string) => {
    setFormData((prev) => ({ ...prev, file_url: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const form = new FormData();
      form.append("patient_id", formData.patient_id);
      form.append("report_type", formData.report_type);
      form.append("summary", formData.summary);
      form.append("file_url", formData.file_url);

      const res = await fetch("/api/staff/add-report", {
        method: "POST",
        body: form,
      });

      if (res.ok) {
        alert("Report added successfully!");
        router.refresh();
        setFormData({ patient_id: "", report_type: "", summary: "", file_url: "" });
      } else {
        alert("Failed to add report.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Add report / scan result</h3>
      <p>
        <small className="muted">
          Doctors, radiologists, and nursing staff can attach bedside notes, imaging PDFs, or cloud scans directly to the chart. Files upload to secure storage and auto-generate a shareable link tied to your staff username (no login toggle between user types).
        </small>
      </p>

      <form onSubmit={handleSubmit} className="grid">
        <div className="grid grid-2">
          <div>
            <label>Patient</label>
            <select
              name="patient_id"
              required
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
            >
              <option value="">-- Select Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (#{p.id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Report Type</label>
            <input
              name="report_type"
              placeholder="Nursing Note / Radiology Result / ECG Result"
              required
              value={formData.report_type}
              onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label>Summary</label>
          <textarea
            name="summary"
            rows={4}
            placeholder="Vitals, impressions, recommendations"
            required
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
          />
        </div>

        <div className="grid grid-2">
          <div>
            <label>Upload Scan/Image</label>
            <UploadWidget
              onUploadComplete={handleUploadComplete}
              bucket="reports"
              folder={formData.patient_id ? `patient-${formData.patient_id}` : undefined}
              label="Attach scan or report"
            />
            {formData.file_url && (
              <div style={{ marginTop: 10, background: "#f7f9fd", border: "1px solid #e5e8ef", padding: 10, borderRadius: 10 }}>
                <strong style={{ display: "block" }}>Attached link</strong>
                <a href={formData.file_url} target="_blank" rel="noreferrer" style={{ wordBreak: "break-all", fontSize: 14 }}>
                  {formData.file_url}
                </a>
                <div style={{ fontSize: 12, color: "#6b7280" }}>Shareable with the care team.</div>
              </div>
            )}
          </div>
          <div>
            <label>Or External URL</label>
            <input
              name="file_url"
              placeholder="https://..."
              value={formData.file_url}
              onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
            />
            <small className="muted">Will be auto-filled if you upload above.</small>
          </div>
        </div>

        <div className="grid grid-2" style={{ alignItems: "end" }}>
          <div>
            <label>Your role</label>
            <input defaultValue={userRole} readOnly style={{ background: "#eee" }} />
            <small className="muted">This is based on your hospital username—no need to switch login types.</small>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" disabled={submitting || !readyToSave}>
              {submitting ? "Saving..." : readyToSave ? "Add Report" : "Fill required fields"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
