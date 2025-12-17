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
      <h3 style={{ marginTop: 0 }}>Add Clinical Report / Scan</h3>
      <p className="muted text-sm" style={{ marginBottom: "1.5rem" }}>
        Attach bedside notes, imaging scans, or reports to the patient's record. Files are stored securely in the "imaging" system.
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
              placeholder="e.g. Nursing Note, X-Ray Result, Lab Report"
              required
              value={formData.report_type}
              onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label>Summary / Findings</label>
          <textarea
            name="summary"
            rows={4}
            placeholder="Enter key findings, impressions, or vital updates..."
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
              bucket="imaging"
              folder={formData.patient_id ? `patient-${formData.patient_id}` : undefined}
              label="Upload Imaging/Scan"
            />
            {formData.file_url && (
              <div style={{ marginTop: "0.75rem", background: "#f0f9ff", border: "1px solid #e2e8f0", padding: "0.75rem", borderRadius: "0.5rem" }}>
                <strong style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem" }}>File Attached:</strong>
                <a href={formData.file_url} target="_blank" rel="noreferrer" style={{ wordBreak: "break-all", fontSize: "0.875rem" }}>
                  View Attachment
                </a>
              </div>
            )}
          </div>
          <div>
            <label>Or External URL (Optional)</label>
            <input
              name="file_url"
              placeholder="https://..."
              value={formData.file_url}
              onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
            />
            <small className="muted">Use this if the file is hosted on an external PACS or Drive.</small>
          </div>
        </div>

        <div className="grid grid-2" style={{ alignItems: "end", marginTop: "1rem" }}>
          <div>
            <label>Logged in as</label>
            <div style={{ background: "#f1f5f9", padding: "0.625rem", borderRadius: "0.5rem", color: "#64748b", fontSize: "0.875rem" }}>
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" disabled={submitting || !readyToSave} style={{ minWidth: "150px" }}>
              {submitting ? "Saving..." : readyToSave ? "Save Report" : "Fill Required Fields"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
