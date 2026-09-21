import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { swipeBodySchema } from "@/lib/api/validation";
import { errorResponse } from "@/lib/api/errors";
import { broadcastSessionEvent } from "@/lib/realtime/broadcast";
import { advanceAfterRound } from "@/lib/session/pipeline";

export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = swipeBodySchema.parse(await req.json());
    const supabase = supabaseServer();

    const { data: session, error: sessionErr } = await supabase
      .from("sessions")
      .select("id, status, round, partner_a_done, partner_b_done")
      .eq("id", id)
      .single();
    if (sessionErr || !session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    if (body.round !== session.round) {
      return NextResponse.json({ stale: true, currentRound: session.round, status: session.status });
    }

    await supabase.from("swipes").upsert(
      {
        session_id: id,
        round: body.round,
        partner_slot: body.slot,
        tmdb_id: body.tmdbId,
        media_type: body.mediaType,
        direction: body.direction,
      },
      { onConflict: "session_id,round,partner_slot,tmdb_id,media_type", ignoreDuplicates: true }
    );

    let matched = false;
    if (body.direction === "right") {
      const otherSlot = body.slot === "a" ? "b" : "a";
      const { data: otherSwipe } = await supabase
        .from("swipes")
        .select("id")
        .eq("session_id", id)
        .eq("round", body.round)
        .eq("partner_slot", otherSlot)
        .eq("tmdb_id", body.tmdbId)
        .eq("media_type", body.mediaType)
        .eq("direction", "right")
        .maybeSingle();

      if (otherSwipe) {
        matched = true;
        await supabase.from("matches").insert({
          session_id: id,
          round: body.round,
          tmdb_id: body.tmdbId,
          media_type: body.mediaType,
        });
        await supabase
          .from("sessions")
          .update({ status: "matched", final_pick_tmdb_id: body.tmdbId, final_pick_media_type: body.mediaType })
          .eq("id", id);
        await broadcastSessionEvent(id, {
          event: "match",
          payload: { tmdbId: body.tmdbId, mediaType: body.mediaType, round: body.round },
        });
      }
    }

    if (!matched) {
      await checkRoundCompletion(supabase, id, body.round, body.slot, session);
    }

    return NextResponse.json({ matched });
  } catch (err) {
    return errorResponse(err);
  }
}

async function checkRoundCompletion(
  supabase: ReturnType<typeof supabaseServer>,
  sessionId: string,
  round: number,
  slot: "a" | "b",
  session: { status: string; partner_a_done: boolean; partner_b_done: boolean }
) {
  const { count: poolCount } = await supabase
    .from("pool_items")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("round", round);

  const { count: swipeCount } = await supabase
    .from("swipes")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("round", round)
    .eq("partner_slot", slot);

  if (!poolCount || (swipeCount ?? 0) < poolCount) return;

  const doneField = slot === "a" ? "partner_a_done" : "partner_b_done";
  await supabase.from("sessions").update({ [doneField]: true }).eq("id", sessionId);

  const otherDone = slot === "a" ? session.partner_b_done : session.partner_a_done;
  if (!otherDone) return;

  const expectedStatus = round === 1 ? "round1_swiping" : "round2_swiping";
  const { data: locked } = await supabase
    .from("sessions")
    .update({ status: "generating_pool" })
    .eq("id", sessionId)
    .eq("status", expectedStatus)
    .select("id")
    .maybeSingle();

  if (locked) {
    await advanceAfterRound(supabase, sessionId, round);
  }
}
