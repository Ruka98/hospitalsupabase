import { cookies } from "next/headers";
import { supabaseAdmin } from "./supabase";
import { sha256Hex, randomToken } from "./security";

const COOKIE_NAME = "hms_session";

export type SessionUser =
  | { userType: "staff"; staff: { id: number; name: string; role: string; category: string | null } }
  | { userType: "patient"; patient: { id: number; name: string } };

export async function createSession(params: { userType: "staff"; staffId: number } | { userType: "patient"; patientId: number }) {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) throw new Error("Missing APP_SESSION_SECRET");

  const token = randomToken(32);
  const tokenHash = sha256Hex(token + secret);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  const sb = supabaseAdmin();
  const insert: any = {
    token_hash: tokenHash,
    user_type: params.userType,
    expires_at: expiresAt.toISOString(),
    staff_id: params.userType === "staff" ? params.staffId : null,
    patient_id: params.userType === "patient" ? params.patientId : null
  };

  const { error } = await sb.from("sessions").insert(insert);
  if (error) throw new Error(error.message);

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  jar.delete(COOKIE_NAME);

  if (!token) return;

  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) return;

  const sb = supabaseAdmin();
  const tokenHash = sha256Hex(token + secret);
  await sb.from("sessions").delete().eq("token_hash", tokenHash);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) throw new Error("Missing APP_SESSION_SECRET");

  const sb = supabaseAdmin();
  const tokenHash = sha256Hex(token + secret);

  // cleanup expired sessions opportunistically
  await sb.from("sessions").delete().lt("expires_at", new Date().toISOString());

  const { data: sess, error } = await sb
    .from("sessions")
    .select("id,user_type,staff_id,patient_id,expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !sess) return null;

  const expires = new Date(sess.expires_at);
  if (expires.getTime() < Date.now()) return null;

  if (sess.user_type === "staff") {
    const { data: staff } = await sb
      .from("staff")
      .select("id,name,role,category")
      .eq("id", sess.staff_id)
      .maybeSingle();

    if (!staff) return null;
    return { userType: "staff", staff: { id: staff.id, name: staff.name, role: staff.role, category: staff.category } };
  }

  const { data: patient } = await sb
    .from("patients")
    .select("id,name")
    .eq("id", sess.patient_id)
    .maybeSingle();

  if (!patient) return null;
  return { userType: "patient", patient: { id: patient.id, name: patient.name } };
}
