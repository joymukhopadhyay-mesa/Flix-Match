"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SwipeDeck } from "@/components/SwipeDeck";
import { getPool, getSessionStatus, swipe, type SessionStatusResponse } from "@/lib/api/client";
import { getSessionSlot } from "@/lib/profile/local";
import { useSessionChannel } from "@/lib/hooks/useSessionChannel";
import { usePolling } from "@/lib/hooks/usePolling";
import type { PartnerSlot, TitleRecord } from "@/lib/types";

export default function SwipePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const slot = getSessionSlot(id) as PartnerSlot | null;

  const [round, setRound] = useState<number | null>(null);
  const [titles, setTitles] = useState<TitleRecord[]>([]);
  const [exhausted, setExhausted] = useState(false);
  const loadedRound = useRef<number | null>(null);

  const loadPoolForRound = useCallback(
    async (r: number) => {
      if (!slot) return;
      const { titles } = await getPool(id, r, slot);
      loadedRound.current = r;
      setTitles(titles);
      setRound(r);
      setExhausted(false);
    },
    [id, slot]
  );

  const handleStatus = useCallback(
    (status: SessionStatusResponse) => {
      if (status.status === "matched" || status.status === "completed") {
        router.replace(`/session/${id}/match`);
        return;
      }
      if (status.status === "final_pick") {
        router.replace(`/session/${id}/final-pick`);
        return;
      }
      if (status.status === "round1_swiping" || status.status === "round2_swiping") {
        if (loadedRound.current !== status.round) loadPoolForRound(status.round);
        return;
      }
      router.replace(`/session/${id}/waiting`);
    },
    [id, router, loadPoolForRound]
  );

  const refetchStatus = useCallback(() => {
    getSessionStatus(id).then(handleStatus);
  }, [id, handleStatus]);

  useEffect(() => {
    refetchStatus();
  }, [refetchStatus]);

  useSessionChannel(id, refetchStatus);
  usePolling(refetchStatus, 5000);

  function handleSwipe(title: TitleRecord, direction: "left" | "right") {
    if (!slot || round == null) return;
    swipe(id, slot, round, title, direction).then((res) => {
      if (res.matched) router.replace(`/session/${id}/match`);
      else if (res.stale) refetchStatus();
    });
  }

  if (!slot) return null;

  return (
    <div className="mx-auto flex h-dvh max-w-sm flex-col px-4 py-3">
      {exhausted ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent-b" />
          <p className="text-sm text-muted">You&apos;re through the list — waiting for your partner to finish theirs…</p>
        </div>
      ) : (
        <SwipeDeck titles={titles} onSwipe={handleSwipe} onExhausted={() => setExhausted(true)} />
      )}
    </div>
  );
}
