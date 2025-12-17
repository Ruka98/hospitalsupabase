import "./globals.css";
import React from "react";

export const metadata = {
  title: "Hospital Management System",
  description: "Next.js + Supabase (tables only) hospital management system"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
