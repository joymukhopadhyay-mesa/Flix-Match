"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QrShare } from "@/components/QrShare";
import { getSessionStatus, type SessionStatusResponse } from "@/lib/api/client";
import { getSessionSlot } from "@/lib/profile/local";
import { useSessionChannel } from "@/lib/hooks/useSessionChannel";
import { usePolling } from "@/lib/hooks/usePolling";
import { routeForStatus } from "@/lib/session/routing";

const LIVE_STATUSES = new Set(["round1_swiping", "round2_swiping", "final_pick", "matched", "completed"]);

const LOADING_LINES = [
  "Reading both moods…",
  "Blending your taste with theirs…",
  "Asking Gemini for a shortlist…",
  "Checking what's actually good…",
  "Finding where to watch it in India…",
];

export default function WaitingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const slot = getSessionSlot(id);
  const [status, setStatus] = useState<SessionStatusResponse | null>(null);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [loadingLine, setLoadingLine] = useState(0);

  useEffect(() => {
    // window.location is only available client-side, so this can't be a lazy useState initializer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJoinUrl(`${window.location.origin}/session/${id}/join`);
  }, [id]);

  function refetch() {
    getSessionStatus(id).then(setStatus);
  }

  useSessionChannel(id, refetch);
  usePolling(refetch, 4000);

  useEffect(() => {
    if (status && LIVE_STATUSES.has(status.status)) {
      router.replace(routeForStatus(id, status.status));
    }
  }, [status, id, router]);

  useEffect(() => {
    if (status?.status !== "generating_pool") return;
    const t = setInterval(() => setLoadingLine((n) => (n + 1) % LOADING_LINES.length), 1800);
    return () => clearInterval(t);
  }, [status?.status]);

  if (!slot || !status) return null;

  const otherName = slot === "a" ? status.partnerB?.display_name : status.partnerA?.display_name;
  const otherEmoji = slot === "a" ? status.partnerB?.emoji : status.partnerA?.emoji;

  if (status.status === "generating_pool") {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent-b" />
        <p className="text-sm text-muted">{LOADING_LINES[loadingLine]}</p>
      </div>
    );
  }

  if (slot === "a" && !status.partnerBJoined && joinUrl) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 px-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Send this to your partner</h1>
          <p className="mt-1 text-sm text-muted">They scan it, answer the same quick questions, and you&apos;re both in.</p>
        </div>
        <QrShare url={joinUrl} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent-b" />
      <p className="text-sm text-muted">
        Waiting for {otherEmoji ?? ""} {otherName ?? "your partner"} to finish picking their mood…
      </p>
    </div>
  );
}
