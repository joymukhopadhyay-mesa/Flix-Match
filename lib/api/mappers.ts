import type { PreferenceInput, TitleRecord } from "@/lib/types";

export function preferencesRowToInput(row: {
  moods: string[];
  mood_freetext: string | null;
  languages: string[];
  content_type: string;
  min_rating: number;
  eras: string[];
}): PreferenceInput {
  return {
    moods: row.moods as PreferenceInput["moods"],
    moodFreeText: row.mood_freetext ?? "",
    languages: row.languages as PreferenceInput["languages"],
    contentType: row.content_type as PreferenceInput["contentType"],
    minRating: row.min_rating as PreferenceInput["minRating"],
    eras: row.eras as PreferenceInput["eras"],
  };
}

export function titleCacheRowToRecord(row: {
  tmdb_id: number;
  media_type: string;
  title: string;
  year: number | null;
  poster_path: string | null;
  synopsis: string | null;
  runtime_minutes: number | null;
  genres: string[];
  tmdb_rating: number | null;
  imdb_id: string | null;
  imdb_rating: number | null;
  ott_options: unknown;
}): TitleRecord {
  return {
    tmdbId: row.tmdb_id,
    mediaType: row.media_type as TitleRecord["mediaType"],
    title: row.title,
    year: row.year,
    posterPath: row.poster_path,
    synopsis: row.synopsis ?? "",
    runtimeMinutes: row.runtime_minutes,
    genres: row.genres ?? [],
    tmdbRating: row.tmdb_rating,
    imdbId: row.imdb_id,
    imdbRating: row.imdb_rating,
    ottOptions: (row.ott_options as TitleRecord["ottOptions"]) ?? [],
  };
}
