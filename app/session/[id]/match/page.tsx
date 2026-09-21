"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MatchReveal } from "@/components/MatchReveal";
import { getMatch } from "@/lib/api/client";
import type { TitleRecord } from "@/lib/types";

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState<TitleRecord | null>(null);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    function poll() {
      getMatch(id).then((res) => {
        if (cancelled) return;
        if (res.title) setTitle(res.title);
        else setTimeout(poll, 1500);
      });
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!title) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6 text-center text-sm text-muted">
        Loading your match…
      </div>
    );
  }

  if (rated) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-2 px-6 text-center">
        <span className="text-3xl">🎬</span>
        <p className="text-sm text-muted">Saved. Enjoy the movie!</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center">
      <MatchReveal title={title} headline="It's a match!" sessionId={id} onRated={() => setRated(true)} />
    </div>
  );
}
