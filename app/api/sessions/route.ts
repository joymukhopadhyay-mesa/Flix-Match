import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createSessionBodySchema } from "@/lib/api/validation";
import { errorResponse } from "@/lib/api/errors";

export async function POST(req: NextRequest) {
  try {
    const body = createSessionBodySchema.parse(await req.json());
    const supabase = supabaseServer();

    await supabase
      .from("profiles")
      .upsert({ id: body.profile.id, display_name: body.profile.displayName, emoji: body.profile.emoji });

    let coupleId = body.coupleId ?? null;
    if (coupleId) {
      const { data: couple } = await supabase
        .from("couples")
        .select("id, partner_a_profile_id")
        .eq("id", coupleId)
        .maybeSingle();
      if (!couple || couple.partner_a_profile_id !== body.profile.id) coupleId = null;
    }

    if (!coupleId) {
      const { data: couple, error } = await supabase
        .from("couples")
        .insert({ partner_a_profile_id: body.profile.id })
        .select("id")
        .single();
      if (error || !couple) throw error ?? new Error("Could not create couple");
      coupleId = couple.id;
    }

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({ couple_id: coupleId })
      .select("id")
      .single();
    if (sessionError || !session) throw sessionError ?? new Error("Could not create session");

    return NextResponse.json({ sessionId: session.id, coupleId });
  } catch (err) {
    return errorResponse(err);
  }
}
