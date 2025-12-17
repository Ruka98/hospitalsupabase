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
      handleFileChange({ target: { files: [droppedFile] } } as React.ChangeEvent<HTMLInputElement>);
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
        border: isDragging ? "2px solid #0070f3" : "1px dashed #c6cedd",
        padding: 20,
        borderRadius: 12,
        backgroundColor: "#f7f9fd",
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

      <p style={{ margin: "0 0 6px", fontWeight: 600 }}>{label}</p>
      <small className="muted">{helperText}</small>

      <div style={{ marginTop: 12, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          className="badge"
          onClick={() => fileInputRef.current?.click()}
          style={{ cursor: uploading ? "not-allowed" : "pointer" }}
          disabled={uploading}
        >
          📁 Browse files
        </button>
        <span style={{ alignSelf: "center", fontSize: 12, color: "#7a8597" }}>or drag & drop here</span>
      </div>

      {file && (
        <div style={{ marginTop: 14, textAlign: "left", background: "white", borderRadius: 10, padding: 12, border: "1px solid #e5e8ef" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
              {preview ? (
                <img src={preview} alt="Preview" style={{ height: 64, width: 64, objectFit: "cover", borderRadius: 8, border: "1px solid #eef0f6" }} />
              ) : (
                <div style={{ width: 64, height: 64, background: "#eef1f6", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, fontWeight: 600 }}>
                  {file.type.split("/")[1]?.toUpperCase() || "FILE"}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{(file.size / 1024).toFixed(1)} KB • {file.type || "Unknown type"}</div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetState();
                  }}
                  style={{ background: "none", border: "none", color: "#d93025", padding: 0, fontSize: 12, cursor: "pointer", textDecoration: "underline", marginTop: 4 }}
                  disabled={uploading}
                >
                  Remove and choose another
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {!success && (
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="badge emphasis"
                  style={{ cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1 }}
                >
                  {uploading ? "Uploading…" : "Upload & attach"}
                </button>
              )}
              {uploading && <span style={{ fontSize: 12, color: "#6b7280" }}>Please keep this tab open…</span>}
              {success && <span style={{ color: "#1b8a3c", fontWeight: 700 }}>✓ Uploaded</span>}
            </div>
          </div>

          {uploadedUrl && (
            <div style={{ marginTop: 10, background: "#f4f9ff", borderRadius: 8, padding: 10, fontSize: 12, color: "#0f172a" }}>
              Attached link: <a href={uploadedUrl} target="_blank" rel="noreferrer">{uploadedUrl}</a>
            </div>
          )}
        </div>
      )}

      {error && <div style={{ color: "#d93025", marginTop: 8 }}>{error}</div>}
      {!file && success && uploadedUrl && (
        <div style={{ color: "#1b8a3c", marginTop: 8, fontWeight: 600 }}>
          File uploaded. You can submit the form using the attached link.
        </div>
      )}
    </div>
  );
}
