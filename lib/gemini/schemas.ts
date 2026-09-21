import { z } from "zod";

// What we actually ask Gemini to produce: the fuzzy, creative half of the
// brief. Hard filters (language, era, min rating, media type) are computed
// deterministically from the two structured preference forms in
// lib/matching/mergePreferences.ts — the model isn't trusted to do that
// arithmetic, only to interpret mood and taste.
export const briefFieldsSchema = z.object({
  genres: z.array(z.string()).max(8),
  keywords: z.array(z.string()).max(10),
  moodSummary: z.string().max(400),
  excludeThemes: z.array(z.string()).max(8),
});

export type BriefFields = z.infer<typeof briefFieldsSchema>;

// Mirrors briefFieldsSchema as a JSON Schema for Gemini's responseJsonSchema config.
export const briefFieldsJsonSchema = {
  type: "object",
  properties: {
    genres: { type: "array", items: { type: "string" }, maxItems: 8 },
    keywords: { type: "array", items: { type: "string" }, maxItems: 10 },
    moodSummary: { type: "string" },
    excludeThemes: { type: "array", items: { type: "string" }, maxItems: 8 },
  },
  required: ["genres", "keywords", "moodSummary", "excludeThemes"],
};

export const tasteNotesSchema = z.object({
  notes: z.string().max(600),
});

export const tasteNotesJsonSchema = {
  type: "object",
  properties: {
    notes: { type: "string" },
  },
  required: ["notes"],
};
