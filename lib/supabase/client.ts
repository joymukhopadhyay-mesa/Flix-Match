"use client";
import { createClient } from "@supabase/supabase-js";

let cached: ReturnType<typeof createClient> | null = null;

/**
 * Publishable-key Supabase client — browser-only, used solely for Realtime Broadcast subscriptions.
 * Uses Supabase's newer `sb_publishable_...` project key (the direct successor to the legacy
 * `anon` JWT) — functionally identical, just a different key format.
 */
export function supabaseBrowser() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
