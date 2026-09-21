import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { errorResponse } from "@/lib/api/errors";
import { titleCacheRowToRecord } from "@/lib/api/mappers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = supabaseServer();

    const { data: session } = await supabase
      .from("sessions")
      .select("final_pick_tmdb_id, final_pick_media_type, status")
      .eq("id", id)
      .single();

    if (!session?.final_pick_tmdb_id || !session.final_pick_media_type) {
      return NextResponse.json({ title: null, status: session?.status ?? null });
    }

    const { data: titleRow } = await supabase
      .from("titles_cache")
      .select("*")
      .eq("tmdb_id", session.final_pick_tmdb_id)
      .eq("media_type", session.final_pick_media_type)
      .maybeSingle();

    return NextResponse.json({
      title: titleRow ? titleCacheRowToRecord(titleRow) : null,
      status: session.status,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
