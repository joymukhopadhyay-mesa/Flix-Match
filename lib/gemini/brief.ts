import "server-only";
import { callGeminiJson } from "@/lib/gemini/client";
import { briefFieldsJsonSchema, briefFieldsSchema, type BriefFields } from "@/lib/gemini/schemas";
import { ERA_LABELS, LANGUAGE_LABELS, MOOD_LABELS, type PreferenceInput } from "@/lib/types";
import type { TitleRecord } from "@/lib/types";

const ALLOWED_GENRES =
  "action, adventure, animation, comedy, crime, documentary, drama, family, fantasy, " +
  "history, horror, music, mystery, romance, science fiction, thriller, war, western, " +
  "kids, news, reality, soap, talk, politics";

function describePreference(label: string, pref: PreferenceInput): string {
  const moods = pref.moods.map((m) => MOOD_LABELS[m]).join(", ") || "no mood picked";
  const languages = pref.languages.map((l) => LANGUAGE_LABELS[l]).join(", ") || "any";
  const eras = pref.eras.map((e) => ERA_LABELS[e]).join(", ") || "any";
  return [
    `${label}:`,
    `- Mood: ${moods}`,
    pref.moodFreeText ? `- In their own words: "${pref.moodFreeText}"` : `- No extra description given`,
    `- Languages: ${languages}`,
    `- Content type: ${pref.contentType === "movies" ? "movies only" : "movies or series"}`,
    `- Minimum rating they want: ${pref.minRating}+`,
    `- Era: ${eras}`,
  ].join("\n");
}

const SYSTEM_PROMPT =
  `You are a movie/TV recommendation strategist for a couples "what should we watch" app. ` +
  `Two partners each independently filled out a mood/taste form. Your job is to read both, ` +
  `find the overlap or a genuine bridge between them, and output the creative half of a search ` +
  `brief that will be used to query TMDB. Hard filters (language, era, rating, movie-vs-series) ` +
  `are handled separately in code — you only decide genres, keywords, a short blended mood ` +
  `summary, and themes to avoid. If the two moods conflict (e.g. one wants scary, the other ` +
  `romantic), don't just pick one side — look for a genre that can satisfy both (e.g. a romantic ` +
  `thriller, a horror-comedy) or note the tension in moodSummary so it can guide ranking. ` +
  `Only use genre names from this list: ${ALLOWED_GENRES}. ` +
  `Output fields: genres (string[]), keywords (string[], specific search terms/themes), ` +
  `moodSummary (1-3 sentences), excludeThemes (string[], things to avoid for either partner).`;

export async function generateInitialBriefFields(
  prefA: PreferenceInput,
  prefB: PreferenceInput,
  coupleTasteNotes: string | null
): Promise<BriefFields> {
  const prompt = [
    describePreference("Partner A", prefA),
    "",
    describePreference("Partner B", prefB),
    coupleTasteNotes ? `\nWhat we know this couple tends to enjoy together: ${coupleTasteNotes}` : "",
  ].join("\n");

  return callGeminiJson(SYSTEM_PROMPT, prompt, briefFieldsJsonSchema, briefFieldsSchema);
}

const REFINE_SYSTEM_PROMPT =
  `You are refining a movie/TV search brief for a couples "what should we watch" app after a ` +
  `round of swiping produced no mutual match. You'll see the original blended brief and what ` +
  `each partner actually swiped right on this round (their real signal, weighted more heavily ` +
  `than the original guess). Lean the new brief into genres/keywords present in BOTH partners' ` +
  `liked titles where possible, or that bridge the two lists. Keep the same output shape as ` +
  `before. Only use genre names from this list: ${ALLOWED_GENRES}.`;

export async function refineBriefFields(
  previous: BriefFields,
  likedByA: TitleRecord[],
  likedByB: TitleRecord[],
  coupleTasteNotes: string | null
): Promise<BriefFields> {
  const describeLiked = (label: string, liked: TitleRecord[]) =>
    liked.length === 0
      ? `${label} liked nothing this round.`
      : `${label} swiped right on: ${liked
          .map((t) => `${t.title} (${t.genres.join("/")})`)
          .join(", ")}`;

  const prompt = [
    `Original mood summary: ${previous.moodSummary}`,
    `Original genres tried: ${previous.genres.join(", ") || "none"}`,
    "",
    describeLiked("Partner A", likedByA),
    describeLiked("Partner B", likedByB),
    coupleTasteNotes ? `\nWhat we know this couple tends to enjoy together: ${coupleTasteNotes}` : "",
  ].join("\n");

  return callGeminiJson(REFINE_SYSTEM_PROMPT, prompt, briefFieldsJsonSchema, briefFieldsSchema);
}
