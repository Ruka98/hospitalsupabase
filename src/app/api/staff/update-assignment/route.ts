import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireStaffRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase";

const Schema = z.object({
  assignment_id: z.coerce.number().int().positive(),
  status: z.enum(["assigned", "in_progress", "completed", "cancelled"])
});

export async function POST(req: Request) {
  const user = await requireUser();
  requireStaffRole(user, ["doctor", "nurse", "radiologist", "lab", "pharmacist"]);

  const form = await req.formData();
  const parsed = Schema.safeParse({
    assignment_id: form.get("assignment_id"),
    status: form.get("status")
  });

  if (!parsed.success) return NextResponse.redirect(new URL("/staff", req.url), { status: 303 });

  const sb = supabaseAdmin();
  const { data: assignment, error: fetchError } = await sb
    .from("assignments")
    .select("id,doctor_id,nurse_id,radiologist_id,lab_staff_id,pharmacist_id,status,patient_id,patients(name)")
    .eq("id", parsed.data.assignment_id)
    .maybeSingle();

  if (fetchError || !assignment) {
    return NextResponse.redirect(new URL("/staff", req.url), { status: 303 });
  }

  const allowedIds = [
    assignment.doctor_id,
    assignment.nurse_id,
    assignment.radiologist_id,
    assignment.lab_staff_id,
    assignment.pharmacist_id
  ].filter(Boolean) as number[];

  if (!allowedIds.includes(user.staff.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await sb
    .from("assignments")
    .update({ status: parsed.data.status })
    .eq("id", assignment.id);

  if (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/staff", req.url), { status: 303 });
  }

  if (parsed.data.status === "completed" && assignment.doctor_id) {
    // Type assertion for joined table result
    const patientsAny = assignment.patients as any;
    const patientLabel = patientsAny?.name
      ? `${patientsAny.name} (#${assignment.patient_id})`
      : `patient #${assignment.patient_id}`;
    const { error: notifErr } = await sb.from("notifications").insert({
      recipient_staff_id: assignment.doctor_id,
      title: "Task completed",
      message: `${patientLabel} task marked completed by ${user.staff.name}.`,
      related_assignment_id: assignment.id
    });
    if (notifErr) console.error(notifErr);
  }

  return NextResponse.redirect(new URL("/staff", req.url), { status: 303 });
}
