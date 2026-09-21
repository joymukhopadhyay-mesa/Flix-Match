import type { PartnerSlot } from "@/lib/types";

export interface SwipeRow {
  partner_slot: PartnerSlot;
  tmdb_id: number;
  media_type: "movie" | "tv";
  direction: "left" | "right";
  created_at: string;
}

export interface ScoredKey {
  tmdbId: number;
  mediaType: "movie" | "tv";
  score: number;
  earliestAt: string;
}

/** Ranks titles by how many partners swiped right on them (2 beats 1), earliest first as a tiebreak. */
export function scoreRightSwipes(swipes: SwipeRow[], limit: number): ScoredKey[] {
  const byKey = new Map<string, { partners: Set<PartnerSlot>; earliestAt: string; tmdbId: number; mediaType: "movie" | "tv" }>();

  for (const swipe of swipes) {
    if (swipe.direction !== "right") continue;
    const key = `${swipe.media_type}:${swipe.tmdb_id}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.partners.add(swipe.partner_slot);
      if (swipe.created_at < existing.earliestAt) existing.earliestAt = swipe.created_at;
    } else {
      byKey.set(key, {
        partners: new Set([swipe.partner_slot]),
        earliestAt: swipe.created_at,
        tmdbId: swipe.tmdb_id,
        mediaType: swipe.media_type,
      });
    }
  }

  return [...byKey.values()]
    .map((v) => ({ tmdbId: v.tmdbId, mediaType: v.mediaType, score: v.partners.size, earliestAt: v.earliestAt }))
    .sort((x, y) => y.score - x.score || (x.earliestAt < y.earliestAt ? -1 : 1))
    .slice(0, limit);
}
