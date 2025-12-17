"use client";

import React, { useState } from "react";
import UploadWidget from "@/components/UploadWidget";
import { useRouter } from "next/navigation";

export default function PatientUploadForm({ patientId }: { patientId: number }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file_url: "",
    file_type: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleUploadComplete = (url: string, type: string) => {
    setFormData((prev) => ({ ...prev, file_url: url, file_type: type }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
        const form = new FormData();
        form.append("title", formData.title);
        form.append("description", formData.description);
        form.append("file_url", formData.file_url);
        form.append("file_type", formData.file_type);

        const res = await fetch("/api/patient/upload-record", {
            method: "POST",
            body: form
        });

        if (res.ok) {
            alert("Document uploaded successfully!");
            router.refresh();
            setFormData({ title: "", description: "", file_url: "", file_type: "" });
        } else {
            alert("Failed to upload document.");
        }
    } catch (err) {
        console.error(err);
        alert("An error occurred.");
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3 style={{ marginTop: 0 }}>Upload Personal Record</h3>
      <p><small className="muted">Upload past medical records or other documents.</small></p>

      <form onSubmit={handleSubmit} className="grid">
        <div className="grid grid-2">
            <div>
                <label>Title</label>
                <input
                    name="title"
                    placeholder="e.g. Past Blood Test"
                    required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                />
            </div>
            <div>
                <label>Description (Optional)</label>
                <input
                    name="description"
                    placeholder="Short description..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                />
            </div>
        </div>

        <div>
            <label>Document</label>
            <UploadWidget
                onUploadComplete={handleUploadComplete}
                bucket="reports"
                folder={`patient-${patientId}/personal`}
                label="Select Document"
            />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
            <button type="submit" disabled={submitting || !formData.file_url}>
                {submitting ? "Saving..." : "Save Record"}
            </button>
        </div>
      </form>
    </div>
  );
}
