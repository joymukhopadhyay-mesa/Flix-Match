import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { joinSessionBodySchema } from "@/lib/api/validation";
import { errorResponse } from "@/lib/api/errors";
import { broadcastSessionEvent } from "@/lib/realtime/broadcast";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = joinSessionBodySchema.parse(await req.json());
    const supabase = supabaseServer();

    await supabase
      .from("profiles")
      .upsert({ id: body.profile.id, display_name: body.profile.displayName, emoji: body.profile.emoji });

    const { data: session, error } = await supabase
      .from("sessions")
      .select("id, status, couple_id, couples(id, partner_b_profile_id)")
      .eq("id", id)
      .single();
    if (error || !session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const couple = Array.isArray(session.couples) ? session.couples[0] : session.couples;
    if (couple) {
      await supabase.from("couples").update({ partner_b_profile_id: body.profile.id }).eq("id", couple.id);
    }

    const sessionUpdate: Record<string, unknown> = { partner_b_joined: true };
    if (session.status === "awaiting_partner_b") sessionUpdate.status = "collecting_preferences";
    await supabase.from("sessions").update(sessionUpdate).eq("id", id);

    await broadcastSessionEvent(id, { event: "preferences-updated", payload: { partnerBJoined: true } });

    return NextResponse.json({ sessionId: id, slot: "b", coupleId: session.couple_id });
  } catch (err) {
    return errorResponse(err);
  }
}
