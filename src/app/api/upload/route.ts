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
    // Default to "imaging" bucket if not specified, as requested for modern hospital system
    const bucketName = formData.get("bucket") as string || "imaging";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const sb = supabaseAdmin();
    const fileExt = file.name.includes(".") ? `.${file.name.split(".").pop()}` : "";

    // Structure: patient-{id}/{year}/{month}/{uuid}
    // We try to organize by patient if possible.

    let filePath = `${randomUUID()}${fileExt}`;
    const folder = formData.get("folder") as string;

    // Sanitize folder path
    if (folder && /^[a-zA-Z0-9-_/]+$/.test(folder)) {
        filePath = `${folder}/${filePath}`;
    } else if (user.userType === "patient") {
        filePath = `patient-${user.patient.id}/${filePath}`;
    } else {
        // Fallback for staff if no folder provided
        filePath = `staff-upload/${filePath}`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await sb.storage.from(bucketName).upload(filePath, buffer, {
      cacheControl: "3600",
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // If "imaging" bucket doesn't exist, it might fail. But we assume it exists as per request.
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
