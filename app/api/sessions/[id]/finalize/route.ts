import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { finalizeBodySchema } from "@/lib/api/validation";
import { errorResponse } from "@/lib/api/errors";
import { broadcastSessionEvent } from "@/lib/realtime/broadcast";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = finalizeBodySchema.parse(await req.json());
    const supabase = supabaseServer();

    const { data: session } = await supabase.from("sessions").select("round").eq("id", id).single();

    await supabase.from("matches").insert({
      session_id: id,
      round: session?.round ?? 2,
      tmdb_id: body.tmdbId,
      media_type: body.mediaType,
    });
    await supabase
      .from("sessions")
      .update({ status: "matched", final_pick_tmdb_id: body.tmdbId, final_pick_media_type: body.mediaType })
      .eq("id", id);

    await broadcastSessionEvent(id, { event: "match", payload: { tmdbId: body.tmdbId, mediaType: body.mediaType, round: session?.round ?? 2 } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
