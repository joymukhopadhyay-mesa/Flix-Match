import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { errorResponse } from "@/lib/api/errors";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = supabaseServer();

    const { data: session, error } = await supabase
      .from("sessions")
      .select(
        "id, status, round, partner_a_done, partner_b_done, partner_b_joined, final_pick_tmdb_id, final_pick_media_type, couple_id, couples(partner_a_profile_id, partner_b_profile_id)"
      )
      .eq("id", id)
      .single();
    if (error || !session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const couple = Array.isArray(session.couples) ? session.couples[0] : session.couples;

    const [{ data: profileA }, { data: profileB }, { data: prefs }] = await Promise.all([
      couple?.partner_a_profile_id
        ? supabase.from("profiles").select("display_name, emoji").eq("id", couple.partner_a_profile_id).maybeSingle()
        : Promise.resolve({ data: null }),
      couple?.partner_b_profile_id
        ? supabase.from("profiles").select("display_name, emoji").eq("id", couple.partner_b_profile_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("preferences").select("partner_slot").eq("session_id", id),
    ]);

    const submittedSlots = new Set((prefs ?? []).map((p: { partner_slot: string }) => p.partner_slot));

    return NextResponse.json({
      sessionId: session.id,
      coupleId: session.couple_id,
      status: session.status,
      round: session.round,
      partnerADone: session.partner_a_done,
      partnerBDone: session.partner_b_done,
      partnerBJoined: session.partner_b_joined,
      partnerAPreferencesSubmitted: submittedSlots.has("a"),
      partnerBPreferencesSubmitted: submittedSlots.has("b"),
      finalPick:
        session.final_pick_tmdb_id != null
          ? { tmdbId: session.final_pick_tmdb_id, mediaType: session.final_pick_media_type }
          : null,
      partnerA: profileA,
      partnerB: profileB,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
