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
    <div className="flex h-full flex-col gap-4">
      <div className="text-center text-xs text-muted">{remaining} left</div>
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <div className="relative aspect-[4/5] w-full max-w-[340px]">
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
      <div className="flex justify-center gap-6 pb-2">
        <button
          type="button"
          aria-label="Pass"
          onClick={() => topCardRef.current?.fling("left")}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-border text-2xl text-danger transition-transform active:scale-90"
        >
          ✕
        </button>
        <button
          type="button"
          aria-label="Like"
          onClick={() => topCardRef.current?.fling("right")}
          className="flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white transition-transform active:scale-90"
          style={{ background: "var(--accent-gradient)" }}
        >
          ♥
        </button>
      </div>
    </div>
  );
}
