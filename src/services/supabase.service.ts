import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getSupabaseServerClientOrThrow() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase non configurato.");
  }

  return supabase;
}
