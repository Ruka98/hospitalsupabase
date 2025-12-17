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
            body: form
        });

        if (res.ok) {
            alert("Report added successfully!");
            router.refresh(); // Refresh server components
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
      <p><small className="muted">Nurses, radiologists, and physicians can attach bedside notes, imaging PDFs, or cloud scans directly to the chart.</small></p>

      <form onSubmit={handleSubmit} className="grid">
        <div className="grid grid-2">
          <div>
            <label>Patient</label>
            <select
                name="patient_id"
                required
                value={formData.patient_id}
                onChange={e => setFormData({...formData, patient_id: e.target.value})}
            >
              <option value="">-- Select Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (#{p.id})</option>
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
                onChange={e => setFormData({...formData, report_type: e.target.value})}
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
            onChange={e => setFormData({...formData, summary: e.target.value})}
          />
        </div>

        <div className="grid grid-2">
          <div>
            <label>Upload Scan/Image</label>
            <UploadWidget
                onUploadComplete={handleUploadComplete}
                bucket="reports"
                folder={formData.patient_id ? `patient-${formData.patient_id}` : undefined}
                label="Attach Scan / Report"
            />
          </div>
          <div>
            <label>Or External URL</label>
            <input
                name="file_url"
                placeholder="https://..."
                value={formData.file_url}
                onChange={e => setFormData({...formData, file_url: e.target.value})}
            />
            <small className="muted">Will be auto-filled if you upload above.</small>
          </div>
        </div>

        <div className="grid grid-2" style={{ alignItems: "end" }}>
          <div>
            <label>Your role</label>
            <input defaultValue={userRole} readOnly style={{ background: "#eee" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Add Report"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
