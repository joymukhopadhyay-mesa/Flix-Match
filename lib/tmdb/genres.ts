// Standard TMDB genre id maps (v3 API, /genre/movie/list and /genre/tv/list).
export const MOVIE_GENRE_IDS: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  "science fiction": 878,
  scifi: 878,
  thriller: 53,
  war: 10752,
  western: 37,
};

export const TV_GENRE_IDS: Record<string, number> = {
  action: 10759,
  adventure: 10759,
  "action & adventure": 10759,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  kids: 10762,
  mystery: 9648,
  news: 10763,
  reality: 10764,
  scifi: 10765,
  "science fiction": 10765,
  fantasy: 10765,
  "sci-fi & fantasy": 10765,
  soap: 10766,
  talk: 10767,
  war: 10768,
  politics: 10768,
  western: 37,
};

export function resolveGenreIds(names: string[], mediaType: "movie" | "tv"): number[] {
  const map = mediaType === "movie" ? MOVIE_GENRE_IDS : TV_GENRE_IDS;
  const ids = new Set<number>();
  for (const raw of names) {
    const id = map[raw.trim().toLowerCase()];
    if (id) ids.add(id);
  }
  return [...ids];
}
