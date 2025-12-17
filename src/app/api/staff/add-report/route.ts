import { NextResponse } from "next/server";
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
  const parsed = Schema.safeParse({
    patient_id: form.get("patient_id"),
    report_type: form.get("report_type"),
    summary: form.get("summary"),
    file_url: (form.get("file_url") as string) || null
  });

  if (!parsed.success) return NextResponse.redirect(new URL("/staff", req.url), { status: 303 });

  const sb = supabaseAdmin();
  const { error } = await sb.from("reports").insert({
    patient_id: parsed.data.patient_id,
    created_by_staff_id: user.staff.id,
    report_type: parsed.data.report_type,
    summary: parsed.data.summary,
    file_url: parsed.data.file_url || null
  });

  if (error) console.error(error);
  return NextResponse.redirect(new URL("/staff", req.url), { status: 303 });
}
