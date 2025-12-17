"use client";

import React, { useMemo, useRef, useState } from "react";

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
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const helperText = useMemo(
    () =>
      success
        ? "Attached securely to the chart. You can save the form now."
        : "Images (PNG, JPG, WebP) and PDFs are supported. We store them safely in S3 (Supabase Storage).",
    [success]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setError(null);
    setSuccess(false);
    setUploadedUrl(null);

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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileChange({ target: { files: [droppedFile] } } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setSuccess(false);
    setError(null);
    setUploadedUrl(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadedUrl(null);

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
      setUploadedUrl(data.url);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        border: isDragging ? "2px solid #0ea5e9" : "1px dashed #cbd5e1",
        padding: "1.5rem",
        borderRadius: "0.75rem",
        backgroundColor: isDragging ? "#f0f9ff" : "#f8fafc",
        textAlign: "center",
        transition: "all 0.2s ease",
      }}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      aria-busy={uploading}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept="image/png,image/jpeg,image/webp,application/pdf"
      />

      <p style={{ margin: "0 0 0.5rem", fontWeight: 600, color: "#334155" }}>{label}</p>
      <small className="muted" style={{ display: "block", marginBottom: "1rem" }}>{helperText}</small>

      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          className="secondary"
          onClick={() => fileInputRef.current?.click()}
          style={{ cursor: uploading ? "not-allowed" : "pointer" }}
          disabled={uploading}
        >
          📁 Browse files
        </button>
        <span style={{ alignSelf: "center", fontSize: "0.875rem", color: "#64748b" }}>or drag & drop here</span>
      </div>

      {file && (
        <div style={{ marginTop: "1rem", textAlign: "left", background: "white", borderRadius: "0.5rem", padding: "0.75rem", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", minWidth: 0 }}>
              {preview ? (
                <img src={preview} alt="Preview" style={{ height: "3rem", width: "3rem", objectFit: "cover", borderRadius: "0.375rem", border: "1px solid #e2e8f0" }} />
              ) : (
                <div style={{ width: "3rem", height: "3rem", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.375rem", fontWeight: 600, color: "#64748b" }}>
                  {file.type.split("/")[1]?.toUpperCase() || "FILE"}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>
                  {file.name}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{(file.size / 1024).toFixed(1)} KB • {file.type || "Unknown type"}</div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetState();
                  }}
                  style={{ background: "none", border: "none", color: "#ef4444", padding: 0, fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline", marginTop: "0.25rem" }}
                  disabled={uploading}
                >
                  Remove
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              {!success && (
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  style={{ cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1, fontSize: "0.875rem", padding: "0.5rem 1rem" }}
                >
                  {uploading ? "Uploading…" : "Upload"}
                </button>
              )}
              {uploading && <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Wait...</span>}
              {success && <span style={{ color: "#22c55e", fontWeight: 600, fontSize: "0.875rem" }}>✓ Uploaded</span>}
            </div>
          </div>

          {uploadedUrl && (
            <div style={{ marginTop: "0.75rem", background: "#f0f9ff", borderRadius: "0.375rem", padding: "0.5rem", fontSize: "0.75rem", color: "#0f172a" }}>
              Attached link: <a href={uploadedUrl} target="_blank" rel="noreferrer" style={{ wordBreak: "break-all" }}>{uploadedUrl}</a>
            </div>
          )}
        </div>
      )}

      {error && <div style={{ color: "#ef4444", marginTop: "0.5rem", fontSize: "0.875rem" }}>{error}</div>}
      {!file && success && uploadedUrl && (
        <div style={{ color: "#22c55e", marginTop: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>
          File uploaded successfully.
        </div>
      )}
    </div>
  );
}
