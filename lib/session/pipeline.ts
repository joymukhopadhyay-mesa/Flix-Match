import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateInitialBriefFields, refineBriefFields } from "@/lib/gemini/brief";
import { buildPool } from "@/lib/matching/pool";
import { mergePreferences } from "@/lib/matching/mergePreferences";
import { broadcastSessionEvent } from "@/lib/realtime/broadcast";
import { preferencesRowToInput, titleCacheRowToRecord } from "@/lib/api/mappers";
import type { BriefFields } from "@/lib/gemini/schemas";
import type { PreferenceInput, TitleRecord } from "@/lib/types";

async function loadPreferences(
  supabase: SupabaseClient,
  sessionId: string
): Promise<{ a: PreferenceInput; b: PreferenceInput }> {
  const { data, error } = await supabase.from("preferences").select("*").eq("session_id", sessionId);
  if (error) throw error;
  const a = data.find((r: { partner_slot: string }) => r.partner_slot === "a");
  const b = data.find((r: { partner_slot: string }) => r.partner_slot === "b");
  if (!a || !b) throw new Error("Both partners must have submitted preferences");
  return { a: preferencesRowToInput(a), b: preferencesRowToInput(b) };
}

async function loadCoupleTasteNotes(supabase: SupabaseClient, sessionId: string): Promise<string | null> {
  const { data } = await supabase
    .from("sessions")
    .select("couple_id, couples(taste_notes)")
    .eq("id", sessionId)
    .single();
  const couples = data?.couples as { taste_notes: string | null } | { taste_notes: string | null }[] | null;
  if (!couples) return null;
  return Array.isArray(couples) ? couples[0]?.taste_notes ?? null : couples.taste_notes ?? null;
}

async function seenExcludeKeys(supabase: SupabaseClient, sessionId: string): Promise<Set<string>> {
  const { data } = await supabase.from("pool_items").select("tmdb_id, media_type").eq("session_id", sessionId);
  return new Set((data ?? []).map((r: { tmdb_id: number; media_type: string }) => `${r.media_type}:${r.tmdb_id}`));
}

/** Runs once both partners have submitted preferences: brief -> pool -> round 1. */
export async function generateRound1(supabase: SupabaseClient, sessionId: string): Promise<void> {
  const { a: prefA, b: prefB } = await loadPreferences(supabase, sessionId);
  const tasteNotes = await loadCoupleTasteNotes(supabase, sessionId);

  await supabase.from("sessions").update({ status: "generating_pool" }).eq("id", sessionId);

  try {
    const mergedFilters = mergePreferences(prefA, prefB);
    const briefFields = await generateInitialBriefFields(prefA, prefB, tasteNotes);

    await buildPool(supabase, sessionId, 1, briefFields, mergedFilters, new Set());

    await supabase
      .from("sessions")
      .update({ status: "round1_swiping", round: 1, brief_fields: briefFields })
      .eq("id", sessionId);

    await broadcastSessionEvent(sessionId, { event: "pool-ready", payload: { round: 1 } });
  } catch (err) {
    // Revert the lock so a resubmitted preferences call (same upsert, idempotent) can retry,
    // instead of leaving the session stuck in "generating_pool" forever.
    await supabase.from("sessions").update({ status: "collecting_preferences" }).eq("id", sessionId);
    throw err;
  }
}

async function loadLikedTitles(
  supabase: SupabaseClient,
  sessionId: string,
  round: number,
  slot: "a" | "b"
): Promise<TitleRecord[]> {
  const { data: swipeRows } = await supabase
    .from("swipes")
    .select("tmdb_id, media_type")
    .eq("session_id", sessionId)
    .eq("round", round)
    .eq("partner_slot", slot)
    .eq("direction", "right");

  if (!swipeRows || swipeRows.length === 0) return [];

  const orFilter = swipeRows
    .map((r: { tmdb_id: number; media_type: string }) => `and(tmdb_id.eq.${r.tmdb_id},media_type.eq.${r.media_type})`)
    .join(",");
  const { data: titleRows } = await supabase.from("titles_cache").select("*").or(orFilter);
  return (titleRows ?? []).map(titleCacheRowToRecord);
}

/** Runs when both partners finish a round with no mutual match: refine -> pool -> next round (or final pick). */
export async function advanceAfterRound(supabase: SupabaseClient, sessionId: string, finishedRound: number): Promise<void> {
  if (finishedRound >= 2) {
    await finalizeTopFive(supabase, sessionId);
    return;
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("brief_fields")
    .eq("id", sessionId)
    .single();
  const previousFields = (session?.brief_fields as BriefFields) ?? {
    genres: [],
    keywords: [],
    moodSummary: "",
    excludeThemes: [],
  };

  const { a: prefA, b: prefB } = await loadPreferences(supabase, sessionId);
  const tasteNotes = await loadCoupleTasteNotes(supabase, sessionId);
  const likedByA = await loadLikedTitles(supabase, sessionId, finishedRound, "a");
  const likedByB = await loadLikedTitles(supabase, sessionId, finishedRound, "b");

  await supabase.from("sessions").update({ status: "generating_pool" }).eq("id", sessionId);

  try {
    const mergedFilters = mergePreferences(prefA, prefB);
    const briefFields = await refineBriefFields(previousFields, likedByA, likedByB, tasteNotes);
    const excludeKeys = await seenExcludeKeys(supabase, sessionId);

    const nextRound = finishedRound + 1;
    await buildPool(supabase, sessionId, nextRound, briefFields, mergedFilters, excludeKeys);

    await supabase
      .from("sessions")
      .update({ status: "round2_swiping", round: nextRound, brief_fields: briefFields, partner_a_done: false, partner_b_done: false })
      .eq("id", sessionId);

    await broadcastSessionEvent(sessionId, { event: "round-advance", payload: { round: nextRound } });
  } catch (err) {
    // Revert the lock so the next swipe from either partner (harmless no-op re-insert, the
    // unique constraint ignores duplicates) re-triggers checkRoundCompletion's retry.
    const fallbackStatus = finishedRound === 1 ? "round1_swiping" : "round2_swiping";
    await supabase
      .from("sessions")
      .update({ status: fallbackStatus, partner_a_done: false, partner_b_done: false })
      .eq("id", sessionId);
    throw err;
  }
}

async function finalizeTopFive(supabase: SupabaseClient, sessionId: string): Promise<void> {
  await supabase.from("sessions").update({ status: "final_pick" }).eq("id", sessionId);
  await broadcastSessionEvent(sessionId, { event: "final-pick", payload: {} });
}
