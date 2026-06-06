import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/config";

export function createSupabaseBrowserClient() {
  const env = getSupabaseEnv();

  if (!env.isConfigured) {
    throw new Error("Supabase browser environment is not configured.");
  }

  return createBrowserClient(env.url, env.anonKey);
}
