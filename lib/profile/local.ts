"use client";

export interface LocalProfile {
  id: string;
  displayName: string;
  emoji: string;
}

const PROFILE_KEY = "mm_profile";
const COUPLE_KEY = "mm_couple_id";

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // private mode / storage blocked — the app still works, just without persistence
  }
}

export function getLocalProfile(): LocalProfile | null {
  const raw = safeGet(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalProfile;
  } catch {
    return null;
  }
}

export function saveLocalProfile(displayName: string, emoji: string): LocalProfile {
  const existing = getLocalProfile();
  const profile: LocalProfile = {
    id: existing?.id ?? crypto.randomUUID(),
    displayName,
    emoji,
  };
  safeSet(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function getLocalCoupleId(): string | null {
  return safeGet(COUPLE_KEY);
}

export function setLocalCoupleId(coupleId: string): void {
  safeSet(COUPLE_KEY, coupleId);
}

export function getSessionSlot(sessionId: string): "a" | "b" | null {
  const value = safeGet(`mm_slot_${sessionId}`);
  return value === "a" || value === "b" ? value : null;
}

export function setSessionSlot(sessionId: string, slot: "a" | "b"): void {
  safeSet(`mm_slot_${sessionId}`, slot);
}
