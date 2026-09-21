"use client";
import { useEffect, useState } from "react";
import { getLocalProfile, saveLocalProfile, type LocalProfile } from "@/lib/profile/local";

const EMOJIS = ["🎬", "🍿", "🦄", "🐉", "😂", "😱", "💕", "🚀", "🎭", "🔥"];

export function NameGate({ children }: { children: (profile: LocalProfile) => React.ReactNode }) {
  const [profile, setProfile] = useState<LocalProfile | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);

  useEffect(() => {
    // localStorage is only available client-side, so this can't be a lazy useState initializer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(getLocalProfile());
  }, []);

  if (profile === undefined) return null;

  if (profile) return <>{children(profile)}</>;

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold">What should we call you?</h1>
        <p className="mt-1 text-sm text-muted">Just for this device — no account needed.</p>
      </div>

      <div className="flex flex-col gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={40}
          className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent-b"
          autoFocus
        />
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-lg border ${
                emoji === e ? "border-accent-b bg-surface-2" : "border-border"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={!name.trim()}
        onClick={() => setProfile(saveLocalProfile(name.trim(), emoji))}
        className="rounded-xl py-3 font-semibold text-white disabled:opacity-40"
        style={{ background: "var(--accent-gradient)" }}
      >
        Continue
      </button>
    </div>
  );
}
