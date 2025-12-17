"use client";

import React, { useState, useRef } from "react";

interface UploadWidgetProps {
  onUploadComplete: (url: string, fileType: string) => void;
  folder?: string;
  bucket?: string;
  label?: string;
}

export default function UploadWidget({ onUploadComplete, folder, bucket = "reports", label = "Upload File" }: UploadWidgetProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setError(null);
    setSuccess(false);

    // Create preview
    if (selected.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);
      if (folder) {
        formData.append("folder", folder);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      onUploadComplete(data.url, file.type);
      setSuccess(true);
      // Clear file after successful upload if needed, or keep it to show "Uploaded" state
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ border: "1px dashed #ccc", padding: 20, borderRadius: 8, textAlign: "center", backgroundColor: "#f9f9f9" }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept="image/png,image/jpeg,image/webp,application/pdf"
      />

      {!file && (
        <div onClick={() => fileInputRef.current?.click()} style={{ cursor: "pointer", padding: 10 }}>
          <p style={{ margin: 0, fontWeight: 500, color: "#0070f3" }}>{label}</p>
          <small className="muted">Click to select (Image or PDF)</small>
        </div>
      )}

      {file && (
        <div>
          <div style={{ marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {preview ? (
              <img src={preview} alt="Preview" style={{ maxHeight: 100, maxWidth: "100%", borderRadius: 4 }} />
            ) : (
              <div style={{ width: 60, height: 60, background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4 }}>
                <span style={{ fontSize: 10 }}>{file.type.split("/")[1] || "FILE"}</span>
              </div>
            )}
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{file.name}</div>
              <div style={{ fontSize: 12, color: "#666" }}>{(file.size / 1024).toFixed(1)} KB</div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); setSuccess(false); }}
                style={{ background: "none", border: "none", color: "red", padding: 0, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
              >
                Remove
              </button>
            </div>
          </div>

          {!success && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="badge emphasis"
              style={{ cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1 }}
            >
              {uploading ? "Uploading..." : "Confirm Upload"}
            </button>
          )}

          {success && <div style={{ color: "green", marginTop: 5, fontWeight: "bold" }}>✓ Uploaded</div>}
          {error && <div style={{ color: "red", marginTop: 5 }}>{error}</div>}
        </div>
      )}
    </div>
  );
}
