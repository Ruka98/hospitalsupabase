import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/guards";
import { supabaseAdmin } from "@/lib/supabase";

const Schema = z.object({ id: z.coerce.number().int().positive() });

export async function POST(req: Request) {
  const user = await requireUser();
  if (user.userType !== "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData();
  const parsed = Schema.safeParse({ id: form.get("id") });
  if (!parsed.success) return NextResponse.redirect(new URL("/dashboard", req.url), { status: 303 });

  const sb = supabaseAdmin();
  await sb.from("notifications").update({ is_read: true }).eq("id", parsed.data.id).eq("recipient_staff_id", user.staff.id);
  return NextResponse.redirect(new URL("/dashboard", req.url), { status: 303 });
}
