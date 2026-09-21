"use client";
import type { LocalProfile } from "@/lib/profile/local";
import type { MediaType, PartnerSlot, PreferenceInput, SessionStatus, TitleRecord } from "@/lib/types";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request to ${url} failed: ${res.status}`);
  return res.json();
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Request to ${url} failed: ${res.status}`);
  return res.json();
}

export function createSession(profile: LocalProfile, coupleId: string | null) {
  return postJson<{ sessionId: string; coupleId: string }>("/api/sessions", { profile, coupleId });
}

export function joinSession(sessionId: string, profile: LocalProfile) {
  return postJson<{ sessionId: string; slot: "b"; coupleId: string }>(`/api/sessions/${sessionId}/join`, { profile });
}

export interface SessionStatusResponse {
  sessionId: string;
  coupleId: string;
  status: SessionStatus;
  round: number;
  partnerADone: boolean;
  partnerBDone: boolean;
  partnerBJoined: boolean;
  partnerAPreferencesSubmitted: boolean;
  partnerBPreferencesSubmitted: boolean;
  finalPick: { tmdbId: number; mediaType: MediaType } | null;
  partnerA: { display_name: string; emoji: string } | null;
  partnerB: { display_name: string; emoji: string } | null;
}

export function getSessionStatus(sessionId: string) {
  return getJson<SessionStatusResponse>(`/api/sessions/${sessionId}`);
}

export function submitPreferences(
  sessionId: string,
  profile: LocalProfile,
  slot: PartnerSlot,
  preferences: PreferenceInput
) {
  return postJson<{ bothSubmitted: boolean }>(`/api/sessions/${sessionId}/preferences`, {
    profile,
    slot,
    preferences,
  });
}

export function getPool(sessionId: string, round: number, slot: PartnerSlot) {
  return getJson<{ titles: TitleRecord[] }>(`/api/sessions/${sessionId}/pool?round=${round}&slot=${slot}`);
}

export function swipe(
  sessionId: string,
  slot: PartnerSlot,
  round: number,
  title: Pick<TitleRecord, "tmdbId" | "mediaType">,
  direction: "left" | "right"
) {
  return postJson<{ matched: boolean; stale?: boolean }>(`/api/sessions/${sessionId}/swipe`, {
    slot,
    round,
    tmdbId: title.tmdbId,
    mediaType: title.mediaType,
    direction,
  });
}

export function getFinalFive(sessionId: string) {
  return getJson<{ titles: (TitleRecord & { combinedScore: number })[] }>(`/api/sessions/${sessionId}/final-five`);
}

export function finalize(sessionId: string, title: Pick<TitleRecord, "tmdbId" | "mediaType">) {
  return postJson<{ ok: true }>(`/api/sessions/${sessionId}/finalize`, {
    tmdbId: title.tmdbId,
    mediaType: title.mediaType,
  });
}

export function getMatch(sessionId: string) {
  return getJson<{ title: TitleRecord | null; status: SessionStatus | null }>(`/api/sessions/${sessionId}/match`);
}

export function submitRating(sessionId: string, rating: number, note: string) {
  return postJson<{ ok: true }>(`/api/sessions/${sessionId}/rating`, { rating, note: note || null });
}
