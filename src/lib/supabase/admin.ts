import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Admin client with service role - bypasses RLS.
 * Use ONLY in server actions/components after validating the user.
 * Returns null if key is missing (e.g. in build or missing env).
 */
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return null;
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
