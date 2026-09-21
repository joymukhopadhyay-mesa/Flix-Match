"use client";
import { useState } from "react";
import { ChipGroup } from "@/components/ChipGroup";
import {
  ERA_LABELS,
  LANGUAGE_LABELS,
  MOOD_LABELS,
  type ContentTypePref,
  type Era,
  type Language,
  type MinRating,
  type Mood,
  type PreferenceInput,
} from "@/lib/types";

const MOOD_OPTIONS = (Object.keys(MOOD_LABELS) as Mood[]).map((value) => ({ value, label: MOOD_LABELS[value] }));
const LANGUAGE_OPTIONS = (Object.keys(LANGUAGE_LABELS) as Language[]).map((value) => ({
  value,
  label: LANGUAGE_LABELS[value],
}));
const ERA_OPTIONS = (Object.keys(ERA_LABELS) as Era[]).map((value) => ({ value, label: ERA_LABELS[value] }));
const RATING_OPTIONS: { value: MinRating; label: string; caveat?: string }[] = [
  { value: 6, label: "6+" },
  { value: 7, label: "7+" },
  { value: 8, label: "8+" },
  { value: 9, label: "9+", caveat: "very few titles" },
];
const CONTENT_TYPE_OPTIONS: { value: ContentTypePref; label: string }[] = [
  { value: "movies", label: "Movies only" },
  { value: "series", label: "Include series" },
];

interface PreferenceFormProps {
  partnerLabel: string;
  onSubmit: (preferences: PreferenceInput) => void;
  submitting: boolean;
}

export function PreferenceForm({ partnerLabel, onSubmit, submitting }: PreferenceFormProps) {
  const [moods, setMoods] = useState<Mood[]>([]);
  const [moodFreeText, setMoodFreeText] = useState("");
  const [languages, setLanguages] = useState<Language[]>([]);
  const [contentType, setContentType] = useState<ContentTypePref[]>([]);
  const [minRating, setMinRating] = useState<MinRating[]>([]);
  const [eras, setEras] = useState<Era[]>([]);

  const canSubmit =
    moods.length > 0 && languages.length > 0 && contentType.length === 1 && minRating.length === 1 && eras.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      moods,
      moodFreeText,
      languages,
      contentType: contentType[0],
      minRating: minRating[0],
      eras,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-muted">{partnerLabel}</p>
        <h1 className="text-2xl font-semibold">What are you in the mood for?</h1>
      </div>

      <Field label="Mood">
        <ChipGroup options={MOOD_OPTIONS} selected={moods} onChange={setMoods} mode="multi" />
      </Field>

      <Field label="Describe what you're in the mood for tonight" optional>
        <textarea
          value={moodFreeText}
          onChange={(e) => setMoodFreeText(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="e.g. something to laugh at after a long week, nothing too heavy"
          className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent-b"
        />
      </Field>

      <Field label="Language">
        <ChipGroup options={LANGUAGE_OPTIONS} selected={languages} onChange={setLanguages} mode="multi" exclusiveValue="any" />
      </Field>

      <Field label="Content type">
        <ChipGroup options={CONTENT_TYPE_OPTIONS} selected={contentType} onChange={setContentType} mode="single" />
      </Field>

      <Field label="Minimum IMDb rating">
        <ChipGroup options={RATING_OPTIONS} selected={minRating} onChange={setMinRating} mode="single" />
      </Field>

      <Field label="Era">
        <ChipGroup options={ERA_OPTIONS} selected={eras} onChange={setEras} mode="multi" exclusiveValue="any" />
      </Field>

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="rounded-xl py-3 font-semibold text-white disabled:opacity-40"
        style={{ background: "var(--accent-gradient)" }}
      >
        {submitting ? "Submitting…" : "Submit my preferences"}
      </button>
    </form>
  );
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {optional && <span className="ml-1.5 text-xs text-muted">(optional)</span>}
      </label>
      {children}
    </div>
  );
}
