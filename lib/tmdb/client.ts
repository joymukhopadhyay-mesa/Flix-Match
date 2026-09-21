import "server-only";
import type { MediaType, SearchBrief } from "@/lib/types";
import { resolveGenreIds } from "@/lib/tmdb/genres";

const TMDB_BASE = "https://api.themoviedb.org/3";

function apiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("Missing TMDB_API_KEY");
  return key;
}

async function tmdbGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", apiKey());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`TMDB ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

interface DiscoverResultRaw {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
}

interface DiscoverResponse {
  results: DiscoverResultRaw[];
}

export interface CandidateTitle {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  year: number | null;
  posterPath: string | null;
  synopsis: string;
  tmdbRating: number;
  voteCount: number;
}

/**
 * Runs one /discover call per (media type x language x era band) combination
 * implied by the brief, merges, and dedupes. TMDB's discover endpoint only
 * accepts a single language and a single date range per call, so a brief
 * spanning several languages/eras fans out into several requests.
 */
export async function discoverCandidates(
  brief: SearchBrief,
  excludeTmdbIds: Set<string>
): Promise<CandidateTitle[]> {
  const languages = brief.languageCodes.length > 0 ? brief.languageCodes : [null];
  const yearRanges = brief.yearRanges.length > 0 ? brief.yearRanges : [{ from: null, to: null }];
  const mediaTypes = brief.mediaTypes.length > 0 ? brief.mediaTypes : ["movie" as MediaType];

  const jobs: Promise<CandidateTitle[]>[] = [];

  for (const mediaType of mediaTypes) {
    const genreIds = resolveGenreIds(brief.genres, mediaType);
    for (const lang of languages) {
      for (const range of yearRanges) {
        jobs.push(discoverOne(mediaType, genreIds, lang, range, brief.minRating));
      }
    }
  }

  const merged = new Map<string, CandidateTitle>();
  for (const batch of await Promise.all(jobs)) {
    for (const candidate of batch) {
      const key = `${candidate.mediaType}:${candidate.tmdbId}`;
      if (excludeTmdbIds.has(key)) continue;
      if (!merged.has(key)) merged.set(key, candidate);
    }
  }

  return [...merged.values()].sort((a, b) => b.voteCount - a.voteCount);
}

async function discoverOne(
  mediaType: MediaType,
  genreIds: number[],
  languageCode: string | null,
  yearRange: { from: number | null; to: number | null },
  minRating: number
): Promise<CandidateTitle[]> {
  const params: Record<string, string> = {
    sort_by: "popularity.desc",
    include_adult: "false",
    "vote_average.gte": String(Math.max(0, minRating - 1.5)), // soft pre-filter; OMDb rating is the real gate
    "vote_count.gte": "20",
    page: "1",
  };
  if (genreIds.length > 0) params.with_genres = genreIds.join("|");
  if (languageCode) params.with_original_language = languageCode;

  const dateField = mediaType === "movie" ? "primary_release_date" : "first_air_date";
  if (yearRange.from) params[`${dateField}.gte`] = `${yearRange.from}-01-01`;
  if (yearRange.to) params[`${dateField}.lte`] = `${yearRange.to}-12-31`;

  try {
    const data = await tmdbGet<DiscoverResponse>(`/discover/${mediaType}`, params);
    return data.results.map((r) => toCandidateTitle(r, mediaType));
  } catch {
    return [];
  }
}

function toCandidateTitle(r: DiscoverResultRaw, mediaType: MediaType): CandidateTitle {
  const dateStr = mediaType === "movie" ? r.release_date : r.first_air_date;
  return {
    tmdbId: r.id,
    mediaType,
    title: (r.title ?? r.name ?? "Untitled") as string,
    year: dateStr ? parseInt(dateStr.slice(0, 4), 10) : null,
    posterPath: r.poster_path,
    synopsis: r.overview,
    tmdbRating: r.vote_average,
    voteCount: r.vote_count,
  };
}

interface DetailsResponseRaw {
  runtime?: number;
  episode_run_time?: number[];
  genres: { name: string }[];
  external_ids?: { imdb_id?: string | null };
}

export interface TitleDetails {
  runtimeMinutes: number | null;
  genres: string[];
  imdbId: string | null;
}

export async function fetchTitleDetails(tmdbId: number, mediaType: MediaType): Promise<TitleDetails> {
  const data = await tmdbGet<DetailsResponseRaw>(`/${mediaType}/${tmdbId}`, {
    append_to_response: "external_ids",
  });
  return {
    runtimeMinutes: mediaType === "movie" ? data.runtime ?? null : data.episode_run_time?.[0] ?? null,
    genres: data.genres.map((g) => g.name),
    imdbId: data.external_ids?.imdb_id ?? null,
  };
}
