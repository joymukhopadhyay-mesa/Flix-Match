"use client";
import Image from "next/image";
import type { TitleRecord } from "@/lib/types";

interface FinalPickListProps {
  titles: (TitleRecord & { combinedScore: number })[];
  onPick: (title: TitleRecord) => void;
  picking: boolean;
}

export function FinalPickList({ titles, onPick, picking }: FinalPickListProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold">No mutual match yet — you pick together</h1>
        <p className="mt-1 text-sm text-muted">Ranked by how many of you liked each one. Tap the one you both want.</p>
      </div>

      <div className="flex flex-col gap-3">
        {titles.map((title) => {
          const posterUrl = title.posterPath ? `https://image.tmdb.org/t/p/w200${title.posterPath}` : null;
          return (
            <button
              key={`${title.mediaType}:${title.tmdbId}`}
              type="button"
              disabled={picking}
              onClick={() => onPick(title)}
              className="flex gap-3 rounded-2xl border border-border bg-surface p-3 text-left transition-colors hover:border-accent-b disabled:opacity-50"
            >
              <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                {posterUrl && <Image src={posterUrl} alt={title.title} fill className="object-cover" sizes="64px" />}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold leading-tight">{title.title}</h3>
                  <span className="whitespace-nowrap rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                    {title.combinedScore === 2 ? "both liked" : "one liked"}
                  </span>
                </div>
                <div className="flex gap-2 text-xs text-muted">
                  {title.year && <span>{title.year}</span>}
                  {title.imdbRating != null && <span>⭐ {title.imdbRating.toFixed(1)}</span>}
                </div>
                <p className="line-clamp-2 text-xs text-muted">{title.synopsis}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
