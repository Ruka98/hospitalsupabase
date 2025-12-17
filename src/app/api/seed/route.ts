import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { hashPassword } from "@/lib/security";

/**
 * One-time seed endpoint.
 * Call: GET /api/seed
 * It will create an admin user if it doesn't exist.
 * Disable/remove after seeding in production.
 */
export async function GET(req: Request) {
  const username = process.env.SEED_ADMIN_USERNAME || "admin";
  const password = process.env.SEED_ADMIN_PASSWORD || "admin123";

  const sb = supabaseAdmin();
  const { data: existing } = await sb.from("staff").select("id").eq("username", username).maybeSingle();
  if (existing) return NextResponse.json({ ok: true, message: "Admin already exists" });

  const password_hash = await hashPassword(password);
  const { error } = await sb.from("staff").insert({
    name: "Administrator",
    role: "admin",
    category: "Management",
    username,
    password_hash,
    is_available: true
  });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, message: `Seeded admin '${username}'` });
}
