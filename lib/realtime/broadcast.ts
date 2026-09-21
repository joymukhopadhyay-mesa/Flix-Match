import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { sessionChannelName, type SessionEvent } from "@/lib/realtime/channel";

/** Publishes an event on a session's broadcast channel so both partners' screens react live. */
export async function broadcastSessionEvent(sessionId: string, message: SessionEvent): Promise<void> {
  const supabase = supabaseServer();
  const channel = supabase.channel(sessionChannelName(sessionId));

  await new Promise<void>((resolve) => {
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") resolve();
    });
  });

  await channel.send({ type: "broadcast", event: message.event, payload: message.payload });
  await supabase.removeChannel(channel);
}
