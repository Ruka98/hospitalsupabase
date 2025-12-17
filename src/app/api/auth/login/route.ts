import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyPassword } from "@/lib/security";
import { createSession } from "@/lib/session";

const Schema = z.object({
  userType: z.enum(["staff","patient"]),
  username: z.string().min(1),
  password: z.string().min(1)
});

export async function POST(req: Request) {
  const form = await req.formData();
  const parsed = Schema.safeParse({
    userType: form.get("userType"),
    username: form.get("username"),
    password: form.get("password")
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  }

  const { userType, username, password } = parsed.data;
  const sb = supabaseAdmin();

  if (userType === "staff") {
    const { data: staff } = await sb.from("staff").select("id,username,password_hash").eq("username", username).maybeSingle();
    if (!staff) return NextResponse.redirect(new URL("/login", req.url), { status: 303 });

    const ok = await verifyPassword(password, staff.password_hash);
    if (!ok) return NextResponse.redirect(new URL("/login", req.url), { status: 303 });

    await createSession({ userType: "staff", staffId: staff.id });
    return NextResponse.redirect(new URL("/dashboard", req.url), { status: 303 });
  }

  const { data: patient } = await sb.from("patients").select("id,username,password_hash").eq("username", username).maybeSingle();
  if (!patient) return NextResponse.redirect(new URL("/login", req.url), { status: 303 });

  const ok = await verifyPassword(password, patient.password_hash);
  if (!ok) return NextResponse.redirect(new URL("/login", req.url), { status: 303 });

  await createSession({ userType: "patient", patientId: patient.id });
  return NextResponse.redirect(new URL("/dashboard", req.url), { status: 303 });
}
