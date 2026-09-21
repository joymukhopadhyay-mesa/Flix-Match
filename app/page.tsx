"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { NameGate } from "@/components/NameGate";
import { createSession } from "@/lib/api/client";
import { getLocalCoupleId, setLocalCoupleId, setSessionSlot } from "@/lib/profile/local";
import type { LocalProfile } from "@/lib/profile/local";

export default function HomePage() {
  return (
    <NameGate>
      {(profile) => <StartScreen profile={profile} />}
    </NameGate>
  );
}

function StartScreen({ profile }: { profile: LocalProfile }) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      const { sessionId, coupleId } = await createSession(profile, getLocalCoupleId());
      setLocalCoupleId(coupleId);
      setSessionSlot(sessionId, "a");
      router.push(`/session/${sessionId}/preferences`);
    } catch {
      setError("Couldn't start a session — check the server is configured with its API keys.");
      setStarting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-muted">Hey {profile.emoji} {profile.displayName}</span>
        <h1 className="text-4xl font-bold leading-tight">
          Stop scrolling. <span className="gradient-text">Start watching.</span>
        </h1>
        <p className="text-sm text-muted">
          You and your partner each pick your mood, we find 30 things you&apos;ll both actually like, and
          you swipe until you land on tonight&apos;s pick — with exactly where to watch it.
        </p>
      </div>

      <button
        type="button"
        onClick={handleStart}
        disabled={starting}
        className="w-full rounded-2xl py-4 text-base font-semibold text-white shadow-lg disabled:opacity-50"
        style={{ background: "var(--accent-gradient)" }}
      >
        {starting ? "Setting things up…" : "Start tonight's pick"}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
