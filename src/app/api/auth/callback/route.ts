import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createSession } from "@/lib/session";
import { createClient } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const error_description = requestUrl.searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error_description || error)}`, req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=No+code+provided", req.url));
  }

  // Use @supabase/ssr to exchange the code for a session.
  // This handles PKCE by reading the code verifier from cookies.
  const supabase = await createClient();
  const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code);

  if (authError || !session || !session.user || !session.user.email) {
    console.error("Auth error:", authError);
    return NextResponse.redirect(new URL(`/login?error=Authentication+failed`, req.url));
  }

  const email = session.user.email;
  const sb = supabaseAdmin();

  // 1. Check Staff
  try {
    const { data: staff } = await sb.from("staff").select("id").eq("email", email).maybeSingle();

    if (staff) {
      await createSession({ userType: "staff", staffId: staff.id });
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  } catch (err) {
    console.error("Error querying staff email:", err);
  }

  // 2. Check Patients
  try {
    const { data: patient } = await sb.from("patients").select("id").eq("email", email).maybeSingle();

    if (patient) {
      await createSession({ userType: "patient", patientId: patient.id });
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  } catch (err) {
    console.error("Error querying patient email:", err);
  }

  // If no match found
  return NextResponse.redirect(new URL("/login?error=User+not+found+with+this+email", req.url));
}
