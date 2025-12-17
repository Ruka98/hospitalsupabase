import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireStaffRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase";
import { hashPassword } from "@/lib/security";

const Schema = z.object({
  name: z.string().min(1),
  role: z.enum(["admin","doctor","nurse","radiologist","lab","pharmacist"]),
  category: z.string().optional().nullable(),
  username: z.string().min(1),
  password: z.string().min(4),
  is_available: z.enum(["true","false"])
});

export async function POST(req: Request) {
  const user = await requireUser();
  requireStaffRole(user, ["admin"]);

  const form = await req.formData();
  const parsed = Schema.safeParse({
    name: form.get("name"),
    role: form.get("role"),
    category: form.get("category") || null,
    username: form.get("username"),
    password: form.get("password"),
    is_available: form.get("is_available")
  });

  if (!parsed.success) return NextResponse.redirect(new URL("/admin", req.url), { status: 303 });

  const sb = supabaseAdmin();
  const password_hash = await hashPassword(parsed.data.password);

  const { error } = await sb.from("staff").insert({
    name: parsed.data.name,
    role: parsed.data.role,
    category: parsed.data.category,
    username: parsed.data.username,
    password_hash,
    is_available: parsed.data.is_available === "true"
  });

  if (error) {
    console.error(error);
  }
  return NextResponse.redirect(new URL("/admin", req.url), { status: 303 });
}
