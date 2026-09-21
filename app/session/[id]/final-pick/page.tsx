"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FinalPickList } from "@/components/FinalPickList";
import { finalize, getFinalFive } from "@/lib/api/client";
import { useSessionChannel } from "@/lib/hooks/useSessionChannel";
import type { TitleRecord } from "@/lib/types";

export default function FinalPickPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [titles, setTitles] = useState<(TitleRecord & { combinedScore: number })[]>([]);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    getFinalFive(id).then((res) => setTitles(res.titles));
  }, [id]);

  useSessionChannel(id, (event) => {
    if (event === "match") router.replace(`/session/${id}/match`);
  });

  async function handlePick(title: TitleRecord) {
    setPicking(true);
    await finalize(id, title);
    router.replace(`/session/${id}/match`);
  }

  if (titles.length === 0) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6 text-center text-sm text-muted">
        Tallying up what you both liked…
      </div>
    );
  }

  return <FinalPickList titles={titles} onPick={handlePick} picking={picking} />;
}
