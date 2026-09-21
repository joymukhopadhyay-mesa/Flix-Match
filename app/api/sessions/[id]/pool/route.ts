import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { errorResponse } from "@/lib/api/errors";
import { titleCacheRowToRecord } from "@/lib/api/mappers";
import { seededShuffle } from "@/lib/matching/shuffle";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const round = Number(req.nextUrl.searchParams.get("round") ?? "1");
    const slot = req.nextUrl.searchParams.get("slot");
    if (slot !== "a" && slot !== "b") {
      return NextResponse.json({ error: "slot must be 'a' or 'b'" }, { status: 400 });
    }

    const supabase = supabaseServer();
    const { data: poolItems, error } = await supabase
      .from("pool_items")
      .select("tmdb_id, media_type")
      .eq("session_id", id)
      .eq("round", round);
    if (error) throw error;
    if (!poolItems || poolItems.length === 0) return NextResponse.json({ titles: [] });

    const orFilter = poolItems
      .map((p: { tmdb_id: number; media_type: string }) => `and(tmdb_id.eq.${p.tmdb_id},media_type.eq.${p.media_type})`)
      .join(",");
    const { data: titleRows, error: titlesError } = await supabase.from("titles_cache").select("*").or(orFilter);
    if (titlesError) throw titlesError;

    const titles = (titleRows ?? []).map(titleCacheRowToRecord);
    const shuffled = seededShuffle(titles, `${id}:${round}:${slot}`);

    return NextResponse.json({ titles: shuffled });
  } catch (err) {
    return errorResponse(err);
  }
}
