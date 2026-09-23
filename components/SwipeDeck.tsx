"use client";
import { useMemo, useRef, useState } from "react";
import { SwipeCard, type SwipeCardHandle } from "@/components/SwipeCard";
import type { TitleRecord } from "@/lib/types";

interface SwipeDeckProps {
  titles: TitleRecord[];
  onSwipe: (title: TitleRecord, direction: "left" | "right") => void;
  onExhausted: () => void;
}

export function SwipeDeck({ titles, onSwipe, onExhausted }: SwipeDeckProps) {
  const [index, setIndex] = useState(0);
  const topCardRef = useRef<SwipeCardHandle>(null);
  const visible = useMemo(() => titles.slice(index, index + 3), [titles, index]);
  const remaining = titles.length - index;

  function handleSwiped(direction: "left" | "right") {
    const title = titles[index];
    onSwipe(title, direction);
    if (index + 1 >= titles.length) {
      onExhausted();
    } else {
      setIndex((i) => i + 1);
    }
  }

  if (titles.length === 0) {
    return <div className="flex h-full items-center justify-center text-muted">Loading tonight&apos;s picks…</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between pb-3">
        <span className="rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-medium text-muted backdrop-blur-md">
          {remaining} left
        </span>
      </div>

      <div className="relative flex flex-1 items-center justify-center">
        <div
          aria-hidden
          className="pointer-events-none absolute h-[55%] w-[80%] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(closest-side, var(--accent-b), transparent)" }}
        />
        <div className="relative aspect-[4/5] w-auto" style={{ height: "min(78dvh, calc(94vw * 1.25))" }}>
          {visible.map((title, i) => (
            <SwipeCard
              key={`${title.mediaType}:${title.tmdbId}`}
              ref={i === 0 ? topCardRef : undefined}
              title={title}
              active={i === 0}
              stackDepth={i}
              onSwiped={handleSwiped}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-8 pb-1 pt-4">
        <button
          type="button"
          aria-label="Pass"
          onClick={() => topCardRef.current?.fling("left")}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-surface text-3xl text-danger shadow-lg shadow-black/40 transition-transform active:scale-90"
        >
          ✕
        </button>
        <button
          type="button"
          aria-label="Like"
          onClick={() => topCardRef.current?.fling("right")}
          className="flex h-16 w-16 items-center justify-center rounded-full text-3xl text-white shadow-lg shadow-black/40 transition-transform active:scale-90"
          style={{ background: "var(--accent-gradient)" }}
        >
          ♥
        </button>
      </div>
    </div>
  );
}
