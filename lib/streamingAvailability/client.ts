import "server-only";
import type { OttOption } from "@/lib/types";

interface StreamingOption {
  service: { name: string };
  type: "free" | "subscription" | "buy" | "rent" | "addon";
  link: string;
  quality?: string;
}

interface ShowResponse {
  streamingOptions?: Record<string, StreamingOption[]>;
}

/**
 * Looks up current India streaming availability for a title via its TMDB id.
 *
 * NOT YET UPDATED: this request shape (`/shows/{mediaType}/{tmdbId}`) matches the
 * "Streaming Availability" API this was originally built against, not the "OTT details"
 * API (gox-ai) actually configured via RAPID_API_HOST — confirmed live that that provider
 * uses a different contract (a `/search?title=` endpoint keyed by IMDb id, not TMDB id; its
 * per-title detail endpoint wasn't identified). This will silently return no results until
 * it's rewritten against the real contract — see chat.
 */
export async function fetchIndiaOttOptions(
  tmdbId: number,
  mediaType: "movie" | "tv"
): Promise<OttOption[]> {
  const apiKey = process.env.RAPID_API_KEY;
  const host = process.env.RAPID_API_HOST ?? "streaming-availability.p.rapidapi.com";
  if (!apiKey) return [];

  const url = `https://${host}/shows/${mediaType}/${tmdbId}?country=in&series_granularity=show`;
  const res = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": host,
    },
    cache: "no-store",
  });
  if (!res.ok) return [];

  const data = (await res.json()) as ShowResponse;
  const options = data.streamingOptions?.in ?? [];
  return options.map((opt) => ({
    service: opt.service.name,
    type: opt.type,
    link: opt.link,
    quality: opt.quality,
  }));
}
