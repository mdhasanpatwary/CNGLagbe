import { supabase } from "./supabase";

/**
 * Broadcasts a status change to a specific booking channel.
 * This allows the client to receive instant updates without waiting for the next poll.
 */
export async function broadcastStatusChange(bookingId: string, status: string) {
  try {
    const channel = supabase.channel(`booking-${bookingId}`);
    // We don't need to keep the channel open, just send the broadcast
    await channel.send({
      type: "broadcast",
      event: "status_change",
      payload: { status },
    });
    // Optional: supabase.removeChannel(channel) if needed, 
    // but in serverless it'll probably just die anyway.
  } catch (error) {
    console.error("Realtime Broadcast Error:", error);
  }
}
