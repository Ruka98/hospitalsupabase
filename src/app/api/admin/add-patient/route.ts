import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireStaffRole } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase";
import { hashPassword } from "@/lib/security";

const Schema = z.object({
  name: z.string().min(1),
  age: z.coerce.number().int().min(0).optional().nullable(),
  gender: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  username: z.string().min(1),
  password: z.string().min(4)
});

export async function POST(req: Request) {
  const user = await requireUser();
  requireStaffRole(user, ["admin"]);

  const form = await req.formData();
  const parsed = Schema.safeParse({
    name: form.get("name"),
    age: form.get("age") ? Number(form.get("age")) : null,
    gender: form.get("gender") || null,
    phone: form.get("phone") || null,
    address: form.get("address") || null,
    username: form.get("username"),
    password: form.get("password")
  });

  if (!parsed.success) return NextResponse.redirect(new URL("/admin", req.url), { status: 303 });

  const sb = supabaseAdmin();
  const password_hash = await hashPassword(parsed.data.password);

  const { error } = await sb.from("patients").insert({
    name: parsed.data.name,
    age: parsed.data.age,
    gender: parsed.data.gender,
    phone: parsed.data.phone,
    address: parsed.data.address,
    username: parsed.data.username,
    password_hash
  });

  if (error) console.error(error);
  return NextResponse.redirect(new URL("/admin", req.url), { status: 303 });
}
