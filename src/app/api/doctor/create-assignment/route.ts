import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireStaffRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase";

const Schema = z.object({
  patient_id: z.coerce.number().int().positive(),
  service_type: z.string().min(1),
  status: z.enum(["assigned","in_progress","done","cancelled"]),
  nurse_id: z.string().optional().nullable(),
  radiologist_id: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export async function POST(req: Request) {
  const user = await requireUser();
  requireStaffRole(user, ["doctor"]);

  const form = await req.formData();
  const parsed = Schema.safeParse({
    patient_id: form.get("patient_id"),
    service_type: form.get("service_type"),
    status: form.get("status"),
    nurse_id: form.get("nurse_id") || null,
    radiologist_id: form.get("radiologist_id") || null,
    notes: form.get("notes") || null
  });

  if (!parsed.success) return NextResponse.redirect(new URL("/doctor", req.url), { status: 303 });

  const nurseId = parsed.data.nurse_id ? Number(parsed.data.nurse_id) : null;
  const radiologistId = parsed.data.radiologist_id ? Number(parsed.data.radiologist_id) : null;

  const sb = supabaseAdmin();
  const { data: patient } = await sb
    .from("patients")
    .select("name")
    .eq("id", parsed.data.patient_id)
    .maybeSingle();

  const { data: inserted, error } = await sb
    .from("assignments")
    .insert({
      patient_id: parsed.data.patient_id,
      doctor_id: user.staff.id,
      nurse_id: nurseId,
      radiologist_id: radiologistId,
      service_type: parsed.data.service_type,
      status: parsed.data.status,
      notes: parsed.data.notes
    })
    .select("id")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/doctor", req.url), { status: 303 });
  }

  const assignmentId = inserted.id as number;
  const patientLabel = patient?.name ? `${patient.name} (#${parsed.data.patient_id})` : `patient #${parsed.data.patient_id}`;

  // Notify assigned staff
  const notifs: any[] = [];
  if (nurseId) {
    notifs.push({
      recipient_staff_id: nurseId,
      title: "New Nurse Assignment",
      message: `You have been assigned to ${patientLabel} for ${parsed.data.service_type}. Assigned by ${user.staff.name}.`,
      related_assignment_id: assignmentId
    });
  }
  if (radiologistId) {
    notifs.push({
      recipient_staff_id: radiologistId,
      title: "New Radiology Assignment",
      message: `You have been assigned to ${patientLabel} for ${parsed.data.service_type}. Assigned by ${user.staff.name}.`,
      related_assignment_id: assignmentId
    });
  }
  if (notifs.length) {
    const { error: nerr } = await sb.from("notifications").insert(notifs);
    if (nerr) console.error(nerr);
  }

  return NextResponse.redirect(new URL("/doctor", req.url), { status: 303 });
}
