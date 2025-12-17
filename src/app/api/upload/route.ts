import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireUser } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    // Allow both staff and patients to upload files
    if (!["staff", "patient"].includes(user.userType)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucketName = formData.get("bucket") as string || "reports";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const sb = supabaseAdmin();
    const fileExt = file.name.includes(".") ? `.${file.name.split(".").pop()}` : "";
    // Organize files by user type and ID to avoid collisions and keep it tidy
    // For patients: patient-{id}/{uuid}
    // For staff uploading for patient: patient-{patient_id}/{uuid} (if patient_id is provided)
    // But this generic upload might just use a flat structure or date-based.
    // Let's rely on the caller to optionally provide a folder prefix, or default to generic.

    // However, to keep it simple and secure, we'll prefix with the uploader's context.
    // If it's a patient: patients/{id}/{uuid}
    // If it's staff: staff/{id}/{uuid} -> Wait, staff usually upload FOR a patient.
    // The previous logic in staff/add-report was `patient-{id}/{uuid}`.

    // Let's stick to a safe default path strategy.
    let filePath = `${randomUUID()}${fileExt}`;

    // If the caller provides a folder (e.g. "patient-123"), use it.
    // But sanitize it to prevent directory traversal.
    const folder = formData.get("folder") as string;
    if (folder && /^[a-zA-Z0-9-_/]+$/.test(folder)) {
        filePath = `${folder}/${filePath}`;
    } else if (user.userType === "patient") {
        filePath = `patient-${user.patient.id}/${filePath}`;
    } else {
        filePath = `staff-upload/${filePath}`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await sb.storage.from(bucketName).upload(filePath, buffer, {
      cacheControl: "3600",
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed: " + uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = sb.storage.from(bucketName).getPublicUrl(filePath);

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      path: filePath,
      name: file.name,
      type: file.type
    });

  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
