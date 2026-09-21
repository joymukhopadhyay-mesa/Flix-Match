"use client";
import { forwardRef, useImperativeHandle } from "react";
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
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-18, 18]);
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

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        x: active ? x : 0,
        rotate: active ? rotate : 0,
        zIndex: 100 - stackDepth,
        scale: 1 - stackDepth * 0.04,
        top: stackDepth * 10,
      }}
      drag={active ? "x" : false}
      dragElastic={0.9}
      onDragEnd={active ? handleDragEnd : undefined}
    >
      <div className="relative h-full w-full overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title.title}
            fill
            priority={stackDepth === 0}
            className="object-cover"
            sizes="(max-width: 480px) 100vw, 420px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">🎬</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

        {active && (
          <>
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-8 left-6 -rotate-12 rounded-lg border-4 border-success px-3 py-1 text-2xl font-black uppercase text-success"
            >
              Like
            </motion.div>
            <motion.div
              style={{ opacity: nopeOpacity }}
              className="absolute top-8 right-6 rotate-12 rounded-lg border-4 border-danger px-3 py-1 text-2xl font-black uppercase text-danger"
            >
              Pass
            </motion.div>
          </>
        )}

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-5 text-white">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl font-bold leading-tight">{title.title}</h2>
            {title.year && <span className="text-sm text-white/70">{title.year}</span>}
          </div>
          <div className="flex items-center gap-3 text-sm text-white/80">
            {title.imdbRating != null && <span>⭐ {title.imdbRating.toFixed(1)} IMDb</span>}
            {title.runtimeMinutes && <span>{formatRuntime(title.runtimeMinutes)}</span>}
          </div>
          <p className="line-clamp-2 text-sm text-white/70">{title.synopsis}</p>
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
