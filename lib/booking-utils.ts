import { Booking, BookingUiState } from "./types/booking";
import { BOOKING_REQUEST_TIMEOUT_SECONDS } from "@/constants/booking";

/**
 * Calculates remaining seconds for a pending booking.
 */
export function getRemainingSeconds(createdAt: string, now: number): number {
  const createdTime = new Date(createdAt).getTime();
  const elapsed = Math.floor((now - createdTime) / 1000);
  return Math.max(0, BOOKING_REQUEST_TIMEOUT_SECONDS - elapsed);
}

/**
 * Derives the UI state from the booking status and countdown.
 */
export function getBookingUiState(booking: Booking | null, remainingSeconds: number): BookingUiState {
  if (!booking) return "FINDING_DRIVER";

  switch (booking.status) {
    case "PENDING":
      return remainingSeconds > 0 ? "FINDING_DRIVER" : "TIMED_OUT";
    case "ACCEPTED":
      return "DRIVER_ASSIGNED";
    case "COMPLETED":
      return "COMPLETED";
    case "CANCELLED":
      return "CANCELLED";
    case "TIMED_OUT":
      return "TIMED_OUT";
    default:
      return "FINDING_DRIVER";
  }
}

/**
 * Formats duration in seconds to "m:ss" or a fallback string if too short.
 */
export function formatDuration(seconds: number, fallback: string): string {
  if (seconds < 10) return fallback;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
