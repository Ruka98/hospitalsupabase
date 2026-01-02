import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  // We can't throw here because this runs on module load, potentially breaking the app if env vars are missing during build time or server-side.
  // But for client-side usage, this will be problematic.
  console.warn("Missing Supabase URL or Anon Key");
}

export const supabaseClient = createClient(supabaseUrl, supabaseKey);
