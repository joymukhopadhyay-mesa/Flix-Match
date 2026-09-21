"use client";
import { useState } from "react";
import { submitRating } from "@/lib/api/client";

export function RatingForm({ sessionId, onSubmitted }: { sessionId: string; onSubmitted: () => void }) {
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating === 0) return;
    setSubmitting(true);
    await submitRating(sessionId, rating, note);
    setSubmitting(false);
    onSubmitted();
  }

  return (
    <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className="text-3xl transition-transform active:scale-90"
            aria-label={`${n} stars`}
          >
            <span className={n <= rating ? "gradient-text" : "text-border"}>★</span>
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={300}
        rows={2}
        placeholder="Anything worth remembering for next time? (optional)"
        className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent-b"
      />
      <button
        type="button"
        disabled={rating === 0 || submitting}
        onClick={handleSubmit}
        className="w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        style={{ background: "var(--accent-gradient)" }}
      >
        {submitting ? "Saving…" : "Save rating"}
      </button>
    </div>
  );
}
