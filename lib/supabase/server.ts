import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any -- no generated Database types; rows are
   validated by our own mappers (lib/api/mappers.ts) instead of the client's generics. */
import { createClient } from "@supabase/supabase-js";

let cached: ReturnType<typeof createClient<any>> | null = null;

/**
 * Secret-key Supabase client — server-only, bypasses RLS. Never import from client components.
 * Uses Supabase's newer `sb_secret_...` project key (the direct successor to the legacy
 * `service_role` JWT) — functionally identical, just a different key format.
 */
export function supabaseServer() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  }

  cached = createClient<any>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
