import "server-only";
import { callGeminiJson } from "@/lib/gemini/client";
import { tasteNotesJsonSchema, tasteNotesSchema } from "@/lib/gemini/schemas";
import type { TitleRecord } from "@/lib/types";

const SYSTEM_PROMPT =
  `You maintain a short running note about a couple's shared taste in movies/TV for a ` +
  `"what should we watch" app, used to bias future recommendations. Given their previous notes ` +
  `plus a title they just watched and rated together, write an updated note (2-4 sentences, ` +
  `plain text, no JSON inside the string). Focus on patterns across multiple watches, not just ` +
  `this one title — mention genres/tones that consistently land well or fall flat, and drop ` +
  `anything that no longer seems relevant. If they rated it low, note what to avoid.`;

export async function updateTasteNotes(
  previousNotes: string | null,
  watched: TitleRecord,
  rating: number,
  note: string | null
): Promise<string> {
  const prompt = [
    previousNotes ? `Previous notes: ${previousNotes}` : "Previous notes: none yet — this is their first rated title.",
    `Just watched: ${watched.title} (${watched.genres.join(", ")})`,
    `Rating out of 5: ${rating}`,
    note ? `Their comment: "${note}"` : "No extra comment.",
  ].join("\n");

  const result = await callGeminiJson(SYSTEM_PROMPT, prompt, tasteNotesJsonSchema, tasteNotesSchema);
  return result.notes;
}
