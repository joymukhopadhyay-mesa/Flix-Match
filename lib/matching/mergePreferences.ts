import { ERA_YEAR_RANGES, LANGUAGE_ISO, type Era, type MediaType, type PreferenceInput } from "@/lib/types";

export interface MergedFilters {
  mediaTypes: MediaType[];
  minRating: number;
  languageCodes: string[];
  yearRanges: { from: number | null; to: number | null }[];
}

/**
 * Combines two partners' hard filters so the result satisfies both.
 * Language/era use intersection (a title must fit both partners' picks),
 * falling back to the union only when the intersection is empty — otherwise
 * two genuinely incompatible picks (e.g. "classic" vs "recent") would zero
 * out the pool instead of Gemini's mood/keyword matching having a chance.
 */
export function mergePreferences(a: PreferenceInput, b: PreferenceInput): MergedFilters {
  const mediaTypes: MediaType[] =
    a.contentType === "movies" || b.contentType === "movies" ? ["movie"] : ["movie", "tv"];

  const minRating = Math.max(a.minRating, b.minRating);

  const languageCodes = intersectOrUnion(languageCodesFor(a), languageCodesFor(b));

  const yearRanges = intersectOrUnionRanges(yearRangesFor(a.eras), yearRangesFor(b.eras));

  return { mediaTypes, minRating, languageCodes, yearRanges };
}

function languageCodesFor(pref: PreferenceInput): string[] {
  if (pref.languages.includes("any") || pref.languages.length === 0) return [];
  return pref.languages.map((l) => LANGUAGE_ISO[l as Exclude<typeof l, "any">]).filter(Boolean);
}

function yearRangesFor(eras: Era[]): { from: number | null; to: number | null }[] {
  if (eras.includes("any") || eras.length === 0) return [];
  return eras.map((e) => ERA_YEAR_RANGES[e as Exclude<Era, "any">]);
}

function intersectOrUnion(a: string[], b: string[]): string[] {
  if (a.length === 0) return b;
  if (b.length === 0) return a;
  const intersection = a.filter((x) => b.includes(x));
  return intersection.length > 0 ? intersection : [...new Set([...a, ...b])];
}

function intersectOrUnionRanges(
  a: { from: number | null; to: number | null }[],
  b: { from: number | null; to: number | null }[]
): { from: number | null; to: number | null }[] {
  if (a.length === 0) return b;
  if (b.length === 0) return a;

  const intersected: { from: number | null; to: number | null }[] = [];
  for (const ra of a) {
    for (const rb of b) {
      const from = maxNullable(ra.from, rb.from);
      const to = minNullable(ra.to, rb.to);
      if (from !== null && to !== null && from > to) continue;
      intersected.push({ from, to });
    }
  }
  return intersected.length > 0 ? intersected : [...a, ...b];
}

function maxNullable(x: number | null, y: number | null): number | null {
  if (x === null) return y;
  if (y === null) return x;
  return Math.max(x, y);
}

function minNullable(x: number | null, y: number | null): number | null {
  if (x === null) return y;
  if (y === null) return x;
  return Math.min(x, y);
}
