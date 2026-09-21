import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { discoverCandidates, fetchTitleDetails, type CandidateTitle } from "@/lib/tmdb/client";
import { fetchImdbRating } from "@/lib/omdb/client";
import { fetchIndiaOttOptions } from "@/lib/streamingAvailability/client";
import { mapWithConcurrency } from "@/lib/util/concurrency";
import type { BriefFields } from "@/lib/gemini/schemas";
import type { MergedFilters } from "@/lib/matching/mergePreferences";
import type { SearchBrief, TitleRecord } from "@/lib/types";

const POOL_SIZE = 30;
const MAX_CANDIDATES_TO_ENRICH = 80;

export async function buildPool(
  supabase: SupabaseClient,
  sessionId: string,
  round: number,
  briefFields: BriefFields,
  mergedFilters: MergedFilters,
  excludeKeys: Set<string>
): Promise<TitleRecord[]> {
  const brief: SearchBrief = { ...briefFields, ...mergedFilters };

  const candidates = await discoverCandidates(brief, excludeKeys);
  const toEnrich = candidates.slice(0, MAX_CANDIDATES_TO_ENRICH);

  const enriched = await mapWithConcurrency(toEnrich, 6, (c) => enrichCandidate(c, brief.minRating));
  const passed = enriched.filter((t): t is TitleRecord => t !== null).slice(0, POOL_SIZE);

  const withOtt = await mapWithConcurrency(passed, 6, async (title) => ({
    ...title,
    ottOptions: await fetchIndiaOttOptions(title.tmdbId, title.mediaType),
  }));

  await cacheTitles(supabase, withOtt);
  await insertPoolItems(supabase, sessionId, round, withOtt);

  return withOtt;
}

async function enrichCandidate(candidate: CandidateTitle, minRating: number): Promise<TitleRecord | null> {
  try {
    const details = await fetchTitleDetails(candidate.tmdbId, candidate.mediaType);
    const imdbRating = details.imdbId ? await fetchImdbRating(details.imdbId) : null;
    const effectiveRating = imdbRating ?? candidate.tmdbRating;
    if (effectiveRating < minRating) return null;

    return {
      tmdbId: candidate.tmdbId,
      mediaType: candidate.mediaType,
      title: candidate.title,
      year: candidate.year,
      posterPath: candidate.posterPath,
      synopsis: candidate.synopsis,
      runtimeMinutes: details.runtimeMinutes,
      genres: details.genres,
      tmdbRating: candidate.tmdbRating,
      imdbId: details.imdbId,
      imdbRating,
      ottOptions: [],
    };
  } catch {
    return null;
  }
}

async function cacheTitles(supabase: SupabaseClient, titles: TitleRecord[]) {
  if (titles.length === 0) return;
  const rows = titles.map((t) => ({
    tmdb_id: t.tmdbId,
    media_type: t.mediaType,
    title: t.title,
    year: t.year,
    poster_path: t.posterPath,
    synopsis: t.synopsis,
    runtime_minutes: t.runtimeMinutes,
    genres: t.genres,
    tmdb_rating: t.tmdbRating,
    imdb_id: t.imdbId,
    imdb_rating: t.imdbRating,
    ott_options: t.ottOptions,
    ott_fetched_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
  await supabase.from("titles_cache").upsert(rows, { onConflict: "tmdb_id,media_type" });
}

async function insertPoolItems(supabase: SupabaseClient, sessionId: string, round: number, titles: TitleRecord[]) {
  if (titles.length === 0) return;
  const rows = titles.map((t) => ({
    session_id: sessionId,
    round,
    tmdb_id: t.tmdbId,
    media_type: t.mediaType,
  }));
  await supabase.from("pool_items").insert(rows);
}
