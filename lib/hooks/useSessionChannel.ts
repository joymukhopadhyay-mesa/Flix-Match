"use client";
import { useEffect, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { sessionChannelName } from "@/lib/realtime/channel";

const EVENTS = ["preferences-updated", "pool-ready", "match", "round-advance", "final-pick", "finalized"];

export function useSessionChannel(sessionId: string, onEvent: (event: string, payload: unknown) => void) {
  const handlerRef = useRef(onEvent);
  useEffect(() => {
    handlerRef.current = onEvent;
  });

  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase.channel(sessionChannelName(sessionId));
    for (const event of EVENTS) {
      channel.on("broadcast", { event }, (message) => handlerRef.current(event, message.payload));
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);
}
