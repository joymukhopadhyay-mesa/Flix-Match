"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { NameGate } from "@/components/NameGate";
import { joinSession } from "@/lib/api/client";
import { getSessionSlot, setLocalCoupleId, setSessionSlot } from "@/lib/profile/local";
import type { LocalProfile } from "@/lib/profile/local";

export default function JoinPage() {
  return <NameGate>{(profile) => <JoinFlow profile={profile} />}</NameGate>;
}

function JoinFlow({ profile }: { profile: LocalProfile }) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const existingSlot = getSessionSlot(id);
    if (existingSlot) {
      router.replace(`/session/${id}/preferences`);
      return;
    }

    joinSession(id, profile)
      .then(({ coupleId }) => {
        setLocalCoupleId(coupleId);
        setSessionSlot(id, "b");
        router.replace(`/session/${id}/preferences`);
      })
      .catch(() => setError("Couldn't find that session — ask for a fresh link."));
  }, [id, profile, router]);

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
      {error ? <p className="text-sm text-danger">{error}</p> : <p className="text-sm text-muted">Joining your partner&apos;s pick…</p>}
    </div>
  );
}
