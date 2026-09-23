"use client";
import { forwardRef, useImperativeHandle, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import Image from "next/image";
import type { TitleRecord } from "@/lib/types";

export interface SwipeCardHandle {
  fling: (direction: "left" | "right") => void;
}

interface SwipeCardProps {
  title: TitleRecord;
  active: boolean;
  stackDepth: number;
  onSwiped: (direction: "left" | "right") => void;
}

const SWIPE_THRESHOLD = 120;
const FLING_DISTANCE = 700;

export const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(function SwipeCard(
  { title, active, stackDepth, onSwiped },
  ref
) {
  const [loaded, setLoaded] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-16, 16]);
  const likeOpacity = useTransform(x, [20, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, -20], [1, 0]);

  useImperativeHandle(ref, () => ({
    fling(direction: "left" | "right") {
      const target = direction === "right" ? FLING_DISTANCE : -FLING_DISTANCE;
      animate(x, target, { duration: 0.3, ease: "easeOut" }).then(() => onSwiped(direction));
    },
  }));

  function handleDragEnd(_event: unknown, info: { offset: { x: number }; velocity: { x: number } }) {
    const shouldSwipeRight = info.offset.x > SWIPE_THRESHOLD || info.velocity.x > 800;
    const shouldSwipeLeft = info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -800;

    if (shouldSwipeRight) {
      animate(x, FLING_DISTANCE, { duration: 0.25, ease: "easeOut" }).then(() => onSwiped("right"));
    } else if (shouldSwipeLeft) {
      animate(x, -FLING_DISTANCE, { duration: 0.25, ease: "easeOut" }).then(() => onSwiped("left"));
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
    }
  }

  const posterUrl = title.posterPath ? `https://image.tmdb.org/t/p/w780${title.posterPath}` : null;
  const rating = title.imdbRating ?? title.tmdbRating;
  const topOtt = title.ottOptions.slice(0, 2);
  const metaParts = [
    title.year != null ? String(title.year) : null,
    title.runtimeMinutes ? formatRuntime(title.runtimeMinutes) : null,
    title.genres[0] ?? null,
  ].filter(Boolean) as string[];

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x: active ? x : 0, rotate: active ? rotate : 0, zIndex: 100 - stackDepth }}
      animate={{ scale: 1 - stackDepth * 0.04, top: stackDepth * 10 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      drag={active ? "x" : false}
      dragElastic={0.9}
      onDragEnd={active ? handleDragEnd : undefined}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[24px] border border-border bg-surface shadow-2xl shadow-black/50">
        {!loaded && <div className="absolute inset-0 animate-pulse bg-surface-2" />}

        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title.title}
            fill
            priority={stackDepth === 0}
            className={`object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
            sizes="(max-width: 480px) 100vw, 420px"
            onLoad={() => setLoaded(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">🎬</div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 via-40% to-transparent" />

        {rating != null && (
          <div className="absolute left-4 top-4 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
            ⭐ {rating.toFixed(1)}
          </div>
        )}

        {topOtt.length > 0 && (
          <div className="absolute right-4 top-4 flex flex-col items-end gap-1.5">
            {topOtt.map((opt, i) => (
              <span
                key={`${opt.service}-${i}`}
                className="rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md"
              >
                {opt.service}
              </span>
            ))}
            {title.ottOptions.length > topOtt.length && (
              <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-[11px] text-white/70 backdrop-blur-md">
                +{title.ottOptions.length - topOtt.length}
              </span>
            )}
          </div>
        )}

        {active && (
          <>
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute left-6 top-24 -rotate-12 rounded-lg border-4 border-success px-3 py-1 text-3xl font-black uppercase text-success"
            >
              Like
            </motion.div>
            <motion.div
              style={{ opacity: nopeOpacity }}
              className="absolute right-6 top-24 rotate-12 rounded-lg border-4 border-danger px-3 py-1 text-3xl font-black uppercase text-danger"
            >
              Pass
            </motion.div>
          </>
        )}

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5">
          <div>
            <h2 className="text-[28px] font-bold leading-tight text-white break-words">{title.title}</h2>
            {metaParts.length > 0 && (
              <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-white/75">
                {metaParts.map((part, i) => (
                  <span key={part} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-white/40">•</span>}
                    {part}
                  </span>
                ))}
              </div>
            )}
          </div>
          <p className="line-clamp-3 text-[15px] leading-snug text-white/70">{title.synopsis}</p>
        </div>
      </div>
    </motion.div>
  );
});

function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
