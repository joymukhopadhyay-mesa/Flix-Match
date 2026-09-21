export type SessionEvent =
  | { event: "preferences-updated"; payload: { partnerBJoined: boolean } }
  | { event: "pool-ready"; payload: { round: number } }
  | { event: "match"; payload: { tmdbId: number; mediaType: "movie" | "tv"; round: number } }
  | { event: "round-advance"; payload: { round: number } }
  | { event: "final-pick"; payload: Record<string, never> }
  | { event: "finalized"; payload: { tmdbId: number; mediaType: "movie" | "tv" } };

export function sessionChannelName(sessionId: string) {
  return `session:${sessionId}`;
}
