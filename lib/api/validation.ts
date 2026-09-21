import { z } from "zod";

export const moodSchema = z.enum(["light_fun", "intense_gripping", "scary", "romantic", "other"]);
export const languageSchema = z.enum(["hindi", "english", "tamil", "telugu", "kannada", "any"]);
export const eraSchema = z.enum(["any", "classic", "2000_2020", "recent"]);

export const preferenceInputSchema = z.object({
  moods: z.array(moodSchema).min(1),
  moodFreeText: z.string().max(500),
  languages: z.array(languageSchema).min(1),
  contentType: z.enum(["movies", "series"]),
  minRating: z.union([z.literal(6), z.literal(7), z.literal(8), z.literal(9)]),
  eras: z.array(eraSchema).min(1),
});

export const profileInputSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(1).max(40),
  emoji: z.string().min(1).max(8),
});

export const partnerSlotSchema = z.enum(["a", "b"]);
export const mediaTypeSchema = z.enum(["movie", "tv"]);

export const swipeBodySchema = z.object({
  slot: partnerSlotSchema,
  round: z.number().int().min(1),
  tmdbId: z.number().int(),
  mediaType: mediaTypeSchema,
  direction: z.enum(["left", "right"]),
});

export const preferencesBodySchema = z.object({
  profile: profileInputSchema,
  slot: partnerSlotSchema,
  preferences: preferenceInputSchema,
});

export const createSessionBodySchema = z.object({
  profile: profileInputSchema,
  coupleId: z.string().uuid().nullable().optional(),
});

export const joinSessionBodySchema = z.object({
  profile: profileInputSchema,
});

export const finalizeBodySchema = z.object({
  tmdbId: z.number().int(),
  mediaType: mediaTypeSchema,
});

export const ratingBodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  note: z.string().max(500).nullable().optional(),
});
