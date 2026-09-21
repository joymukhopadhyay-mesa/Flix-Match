"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import type { TitleRecord } from "@/lib/types";
import { RatingForm } from "@/components/RatingForm";

const TYPE_LABELS: Record<string, string> = {
  subscription: "Stream",
  free: "Free",
  rent: "Rent",
  buy: "Buy",
  addon: "Add-on",
};

export function MatchReveal({
  title,
  headline,
  sessionId,
  onRated,
}: {
  title: TitleRecord;
  headline: string;
  sessionId: string;
  onRated: () => void;
}) {
  const [showRating, setShowRating] = useState(false);
  const posterUrl = title.posterPath ? `https://image.tmdb.org/t/p/w500${title.posterPath}` : null;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-6 py-10 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
        className="flex flex-col items-center gap-2"
      >
        <span className="text-sm font-semibold uppercase tracking-widest gradient-text">{headline}</span>
        <h1 className="text-3xl font-bold">{title.title}</h1>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="relative aspect-2/3 w-56 overflow-hidden rounded-2xl shadow-2xl"
        style={{ boxShadow: "0 20px 60px -10px var(--accent-b)" }}
      >
        {posterUrl ? (
          <Image src={posterUrl} alt={title.title} fill className="object-cover" sizes="224px" />
        ) : (
          <div className="flex h-full items-center justify-center bg-surface text-5xl">🎬</div>
        )}
      </motion.div>

      <div className="flex items-center gap-3 text-sm text-muted">
        {title.year && <span>{title.year}</span>}
        {title.imdbRating != null && <span>⭐ {title.imdbRating.toFixed(1)} IMDb</span>}
        {title.runtimeMinutes && <span>{formatRuntime(title.runtimeMinutes)}</span>}
      </div>

      <p className="text-sm text-muted">{title.synopsis}</p>

      <div className="flex w-full flex-col gap-3">
        <p className="text-sm font-medium">Watch it now on:</p>
        {title.ottOptions.length === 0 ? (
          <p className="text-sm text-muted">Not currently streaming in India — worth checking your usual apps directly.</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-2">
            {title.ottOptions.map((opt, i) => (
              <a
                key={`${opt.service}-${opt.type}-${i}`}
                href={opt.link}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium hover:border-accent-b"
              >
                {opt.service} <span className="text-muted">· {TYPE_LABELS[opt.type] ?? opt.type}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {!showRating ? (
        <button
          type="button"
          onClick={() => setShowRating(true)}
          className="mt-4 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground"
        >
          We watched it — rate it
        </button>
      ) : (
        <RatingForm sessionId={sessionId} onSubmitted={onRated} />
      )}
    </div>
  );
}

function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
