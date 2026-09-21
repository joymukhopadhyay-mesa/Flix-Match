import "server-only";

interface OmdbResponse {
  Response: "True" | "False";
  imdbRating?: string;
  imdbID?: string;
}

/** Looks up the real IMDb rating for a title by its IMDb id (e.g. "tt1285016"). */
export async function fetchImdbRating(imdbId: string): Promise<number | null> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) return null;

  const url = `https://www.omdbapi.com/?apikey=${encodeURIComponent(apiKey)}&i=${encodeURIComponent(imdbId)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const data = (await res.json()) as OmdbResponse;
  if (data.Response !== "True" || !data.imdbRating || data.imdbRating === "N/A") return null;

  const rating = parseFloat(data.imdbRating);
  return Number.isFinite(rating) ? rating : null;
}
