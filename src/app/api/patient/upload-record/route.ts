import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase";

const Schema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  file_url: z.string().min(1),
  file_type: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user.userType !== "patient") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const parsed = Schema.safeParse({
        title: formData.get("title"),
        description: formData.get("description"),
        file_url: formData.get("file_url"),
        file_type: formData.get("file_type"),
    });

    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const sb = supabaseAdmin();
    const { error } = await sb.from("patient_uploads").insert({
        patient_id: user.patient.id,
        title: parsed.data.title,
        description: parsed.data.description,
        file_url: parsed.data.file_url,
        file_type: parsed.data.file_type
    });

    if (error) {
        console.error("DB Error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
