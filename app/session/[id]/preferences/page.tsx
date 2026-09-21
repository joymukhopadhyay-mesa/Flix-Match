"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { NameGate } from "@/components/NameGate";
import { PreferenceForm } from "@/components/PreferenceForm";
import { getSessionStatus, submitPreferences } from "@/lib/api/client";
import { getSessionSlot } from "@/lib/profile/local";
import { routeForStatus } from "@/lib/session/routing";
import type { LocalProfile } from "@/lib/profile/local";
import type { PreferenceInput } from "@/lib/types";

export default function PreferencesPage() {
  return <NameGate>{(profile) => <PreferencesFlow profile={profile} />}</NameGate>;
}

function PreferencesFlow({ profile }: { profile: LocalProfile }) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slot = getSessionSlot(id);

  useEffect(() => {
    if (!slot) return;
    getSessionStatus(id).then((status) => {
      const mySubmitted = slot === "a" ? status.partnerAPreferencesSubmitted : status.partnerBPreferencesSubmitted;
      if (mySubmitted) {
        router.replace(status.status === "collecting_preferences" ? `/session/${id}/waiting` : routeForStatus(id, status.status));
      } else {
        setReady(true);
      }
    });
  }, [id, slot, router]);

  if (!slot) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6 text-center text-sm text-danger">
        This link looks incomplete. Ask your partner to re-share it.
      </div>
    );
  }

  if (!ready) return null;

  async function handleSubmit(preferences: PreferenceInput) {
    setSubmitting(true);
    setError(null);
    try {
      await submitPreferences(id, profile, slot!, preferences);
      router.push(`/session/${id}/waiting`);
    } catch {
      setError("Something went wrong building tonight's shortlist. Try submitting again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-12">
      <PreferenceForm partnerLabel={`${profile.emoji} ${profile.displayName}`} onSubmit={handleSubmit} submitting={submitting} />
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
    </div>
  );
}
