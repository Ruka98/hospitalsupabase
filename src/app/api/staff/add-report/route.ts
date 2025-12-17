import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { requireUser, requireStaffRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase";

const Schema = z.object({
  patient_id: z.coerce.number().int().positive(),
  report_type: z.string().min(1),
  summary: z.string().min(1),
  file_url: z.string().optional().nullable()
});

export async function POST(req: Request) {
  const user = await requireUser();
  requireStaffRole(user, ["nurse","radiologist","doctor"]);

  const form = await req.formData();
  const uploadedFile = form.get("file") as File | null;
  const parsed = Schema.safeParse({
    patient_id: form.get("patient_id"),
    report_type: form.get("report_type"),
    summary: form.get("summary"),
    file_url: (() => {
      const value = form.get("file_url");
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    })()
  });

  if (!parsed.success) return NextResponse.redirect(new URL("/staff", req.url), { status: 303 });

  const sb = supabaseAdmin();
  let fileUrl = parsed.data.file_url || null;

  if (uploadedFile && uploadedFile.size > 0) {
    const bucket = process.env.SUPABASE_REPORTS_BUCKET || "reports";
    const fileExt = uploadedFile.name.includes(".") ? `.${uploadedFile.name.split(".").pop()}` : "";
    const filePath = `patient-${parsed.data.patient_id}/${randomUUID()}${fileExt}`;

    const arrayBuffer = await uploadedFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await sb.storage.from(bucket).upload(filePath, buffer, {
      cacheControl: "3600",
      contentType: uploadedFile.type || "application/octet-stream",
      upsert: false
    });

    if (uploadError) {
      console.error(uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const { data: publicUrlData } = sb.storage.from(bucket).getPublicUrl(filePath);
    fileUrl = publicUrlData.publicUrl;
  }

  const { error } = await sb.from("reports").insert({
    patient_id: parsed.data.patient_id,
    created_by_staff_id: user.staff.id,
    report_type: parsed.data.report_type,
    summary: parsed.data.summary,
    file_url: fileUrl
  });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "DB Error" }, { status: 500 });
  }

  // Support both redirect (old behavior) and JSON (new behavior)
  // Check Accept header
  const accept = req.headers.get("accept");
  if (accept && accept.includes("application/json")) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.redirect(new URL("/staff", req.url), { status: 303 });
}
