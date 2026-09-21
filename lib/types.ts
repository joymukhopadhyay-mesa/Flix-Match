export type PartnerSlot = "a" | "b";

export type Mood =
  | "light_fun"
  | "intense_gripping"
  | "scary"
  | "romantic"
  | "other";

export const MOOD_LABELS: Record<Mood, string> = {
  light_fun: "Light & fun",
  intense_gripping: "Intense & gripping",
  scary: "Scary",
  romantic: "Romantic",
  other: "Other",
};

export type Language = "hindi" | "english" | "tamil" | "telugu" | "kannada" | "any";

export const LANGUAGE_LABELS: Record<Language, string> = {
  hindi: "Hindi",
  english: "English",
  tamil: "Tamil",
  telugu: "Telugu",
  kannada: "Kannada",
  any: "Any",
};

export const LANGUAGE_ISO: Record<Exclude<Language, "any">, string> = {
  hindi: "hi",
  english: "en",
  tamil: "ta",
  telugu: "te",
  kannada: "kn",
};

export type ContentTypePref = "movies" | "series";

export type MinRating = 6 | 7 | 8 | 9;

export type Era = "any" | "classic" | "2000_2020" | "recent";

export const ERA_LABELS: Record<Era, string> = {
  any: "Any",
  classic: "Classic (pre-2000)",
  "2000_2020": "2000–2020",
  recent: "Recent (2021–2026)",
};

export const ERA_YEAR_RANGES: Record<Exclude<Era, "any">, { from: number | null; to: number | null }> = {
  classic: { from: null, to: 1999 },
  "2000_2020": { from: 2000, to: 2020 },
  recent: { from: 2021, to: 2026 },
};

export interface PreferenceInput {
  moods: Mood[];
  moodFreeText: string;
  languages: Language[];
  contentType: ContentTypePref;
  minRating: MinRating;
  eras: Era[];
}

export type SessionStatus =
  | "awaiting_partner_b"
  | "collecting_preferences"
  | "generating_pool"
  | "round1_swiping"
  | "round2_swiping"
  | "final_pick"
  | "matched"
  | "completed";

export type MediaType = "movie" | "tv";

export interface OttOption {
  service: string;
  type: "free" | "subscription" | "buy" | "rent" | "addon";
  link: string;
  quality?: string;
}

export interface TitleRecord {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  year: number | null;
  posterPath: string | null;
  synopsis: string;
  runtimeMinutes: number | null;
  genres: string[];
  tmdbRating: number | null;
  imdbId: string | null;
  imdbRating: number | null;
  ottOptions: OttOption[];
}

export interface SearchBrief {
  genres: string[];
  keywords: string[];
  languageCodes: string[];
  mediaTypes: MediaType[];
  minRating: number;
  yearRanges: { from: number | null; to: number | null }[];
  moodSummary: string;
  excludeThemes: string[];
}

export interface SessionRecord {
  id: string;
  coupleId: string;
  status: SessionStatus;
  round: number;
  partnerADone: boolean;
  partnerBDone: boolean;
  finalPickTmdbId: number | null;
  finalPickMediaType: MediaType | null;
  createdAt: string;
}

export const SESSION_STATUS_ROUTE: Record<SessionStatus, string> = {
  awaiting_partner_b: "waiting",
  collecting_preferences: "waiting",
  generating_pool: "waiting",
  round1_swiping: "swipe",
  round2_swiping: "swipe",
  final_pick: "final-pick",
  matched: "match",
  completed: "match",
};
