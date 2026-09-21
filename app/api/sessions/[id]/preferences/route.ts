import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { preferencesBodySchema } from "@/lib/api/validation";
import { errorResponse } from "@/lib/api/errors";
import { generateRound1 } from "@/lib/session/pipeline";

export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = preferencesBodySchema.parse(await req.json());
    const supabase = supabaseServer();

    await supabase
      .from("profiles")
      .upsert({ id: body.profile.id, display_name: body.profile.displayName, emoji: body.profile.emoji });

    const { error: upsertError } = await supabase.from("preferences").upsert(
      {
        session_id: id,
        partner_slot: body.slot,
        moods: body.preferences.moods,
        mood_freetext: body.preferences.moodFreeText || null,
        languages: body.preferences.languages,
        content_type: body.preferences.contentType,
        min_rating: body.preferences.minRating,
        eras: body.preferences.eras,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "session_id,partner_slot" }
    );
    if (upsertError) throw upsertError;

    const { data: submitted } = await supabase.from("preferences").select("partner_slot").eq("session_id", id);
    const bothSubmitted = new Set((submitted ?? []).map((r: { partner_slot: string }) => r.partner_slot)).size === 2;

    if (!bothSubmitted) {
      await supabase.from("sessions").update({ status: "collecting_preferences" }).eq("id", id);
      return NextResponse.json({ bothSubmitted: false });
    }

    const { data: locked } = await supabase
      .from("sessions")
      .update({ status: "generating_pool" })
      .eq("id", id)
      .in("status", ["awaiting_partner_b", "collecting_preferences"])
      .select("id")
      .maybeSingle();

    if (locked) {
      await generateRound1(supabase, id);
    }
    return NextResponse.json({ bothSubmitted: true });
  } catch (err) {
    return errorResponse(err);
  }
}
