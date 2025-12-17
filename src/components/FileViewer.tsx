"use client";

import React, { useState } from "react";

interface FileViewerProps {
  url: string;
  label?: string;
  type?: string;
}

export default function FileViewer({ url, label = "View File", type }: FileViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Guess type if not provided
  const isImage = type?.startsWith("image/") || url.match(/\.(jpeg|jpg|png|webp)$/i);
  const isPdf = type === "application/pdf" || url.endsWith(".pdf");

  if (!url) return null;

  return (
    <>
      {isImage ? (
        <div style={{ marginTop: 5 }}>
            <img
                src={url}
                alt="Thumbnail"
                style={{ maxHeight: 150, borderRadius: 8, cursor: "pointer", border: "1px solid #eee" }}
                onClick={() => setIsOpen(true)}
            />
            <div style={{fontSize: "0.8em", color: "#666"}}>Click to expand</div>
        </div>
      ) : (
        <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="badge"
            style={{ textDecoration: "none", display: "inline-block", marginTop: 5 }}
        >
            📄 {label}
        </a>
      )}

      {isOpen && isImage && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.8)", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20
          }}
          onClick={() => setIsOpen(false)}
        >
          <img src={url} alt="Full view" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 4 }} />
          <button
            style={{ position: "absolute", top: 20, right: 20, background: "white", border: "none", padding: "10px 15px", borderRadius: 20, cursor: "pointer", fontWeight: "bold" }}
            onClick={() => setIsOpen(false)}
          >
            ✕ Close
          </button>
        </div>
      )}
    </>
  );
}
