import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { errorResponse } from "@/lib/api/errors";
import { titleCacheRowToRecord } from "@/lib/api/mappers";
import { scoreRightSwipes } from "@/lib/matching/scoring";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = supabaseServer();

    const { data: swipes, error } = await supabase
      .from("swipes")
      .select("partner_slot, tmdb_id, media_type, direction, created_at")
      .eq("session_id", id);
    if (error) throw error;

    const top = scoreRightSwipes(swipes ?? [], 5);
    if (top.length === 0) return NextResponse.json({ titles: [] });

    const orFilter = top.map((t) => `and(tmdb_id.eq.${t.tmdbId},media_type.eq.${t.mediaType})`).join(",");
    const { data: titleRows, error: titlesError } = await supabase.from("titles_cache").select("*").or(orFilter);
    if (titlesError) throw titlesError;

    const byKey = new Map((titleRows ?? []).map((r) => [`${r.media_type}:${r.tmdb_id}`, r]));
    const titles = top
      .map((t) => {
        const row = byKey.get(`${t.mediaType}:${t.tmdbId}`);
        return row ? { ...titleCacheRowToRecord(row), combinedScore: t.score } : null;
      })
      .filter(Boolean);

    return NextResponse.json({ titles });
  } catch (err) {
    return errorResponse(err);
  }
}
