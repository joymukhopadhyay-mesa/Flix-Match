import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { ratingBodySchema } from "@/lib/api/validation";
import { errorResponse } from "@/lib/api/errors";
import { updateTasteNotes } from "@/lib/gemini/tasteNotes";
import { titleCacheRowToRecord } from "@/lib/api/mappers";

export const maxDuration = 30;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = ratingBodySchema.parse(await req.json());
    const supabase = supabaseServer();

    const { data: session } = await supabase
      .from("sessions")
      .select("final_pick_tmdb_id, final_pick_media_type, couple_id, couples(taste_notes)")
      .eq("id", id)
      .single();
    if (!session?.final_pick_tmdb_id || !session.final_pick_media_type) {
      return NextResponse.json({ error: "No finalized title on this session yet" }, { status: 400 });
    }

    await supabase.from("ratings").insert({
      session_id: id,
      tmdb_id: session.final_pick_tmdb_id,
      media_type: session.final_pick_media_type,
      rating: body.rating,
      note: body.note ?? null,
    });
    await supabase.from("sessions").update({ status: "completed" }).eq("id", id);

    const { data: titleRow } = await supabase
      .from("titles_cache")
      .select("*")
      .eq("tmdb_id", session.final_pick_tmdb_id)
      .eq("media_type", session.final_pick_media_type)
      .maybeSingle();

    if (titleRow) {
      const couple = Array.isArray(session.couples) ? session.couples[0] : session.couples;
      const notes = await updateTasteNotes(couple?.taste_notes ?? null, titleCacheRowToRecord(titleRow), body.rating, body.note ?? null);
      await supabase.from("couples").update({ taste_notes: notes }).eq("id", session.couple_id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
