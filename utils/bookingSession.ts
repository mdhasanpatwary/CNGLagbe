/**
 * Booking Session Persistence Utility
 *
 * Stores a single "booking session" in localStorage under the key `booking_session_v1`.
 * Protects against corrupted data and enforces a 30-minute TTL.
 *
 * Shape:
 *   pickup  – pick-up coordinates + display label
 *   drop    – drop-off coordinates + display label
 *   route   – cached Directions API result (encoded polyline, road distance/duration texts)
 *   fare    – calculated fare in BDT
 *   lastUpdated – timestamp used for TTL checks
 */

export interface BookingSessionRoute {
  polyline: string;      // encoded polyline from Google Directions API
  distanceText: string;  // e.g. "7.7 km"
  durationText: string;  // e.g. "18 mins"
  durationMinutes: number | null; // e.g. 18
  distanceKm: number;    // raw number for fare display
}

export interface BookingSession {
  pickup: {
    lat: number;
    lng: number;
    label: string;
  };
  drop: {
    lat: number;
    lng: number;
    label: string;
  };
  route: BookingSessionRoute;
  fare: number;
  lastUpdated: number; // Date.now()
}

const SESSION_KEY = "booking_session_v1";
const TTL_MS = 30 * 60 * 1000; // 30 minutes

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidSession(data: unknown): data is BookingSession {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;

  const hasPickup =
    d.pickup &&
    typeof (d.pickup as Record<string, unknown>).lat === "number" &&
    typeof (d.pickup as Record<string, unknown>).lng === "number";

  const hasDrop =
    d.drop &&
    typeof (d.drop as Record<string, unknown>).lat === "number" &&
    typeof (d.drop as Record<string, unknown>).lng === "number";

  const hasRoute =
    d.route &&
    typeof (d.route as Record<string, unknown>).polyline === "string" &&
    (d.route as Record<string, unknown>).polyline !== "";

  const hasFare = typeof d.fare === "number" && d.fare > 0;
  const hasTimestamp = typeof d.lastUpdated === "number";

  return Boolean(hasPickup && hasDrop && hasRoute && hasFare && hasTimestamp);
}

function isExpired(session: BookingSession): boolean {
  return Date.now() - session.lastUpdated > TTL_MS;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Persist a complete booking session to localStorage.
 */
export function saveBookingSession(data: BookingSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch (e) {
    // localStorage may be full or unavailable (private browsing, etc.)
    console.warn("[BookingSession] Could not save session:", e);
  }
}

/**
 * Retrieve a valid, non-expired booking session.
 * Returns `null` if there's no session, it has expired, or the data is corrupt.
 * Automatically clears the storage entry in any of those failure cases.
 */
export function getBookingSession(): BookingSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);

    if (!isValidSession(parsed)) {
      console.warn("[BookingSession] Invalid session structure – clearing.");
      clearBookingSession();
      return null;
    }

    if (isExpired(parsed)) {
      console.info("[BookingSession] Session expired – clearing.");
      clearBookingSession();
      return null;
    }

    return parsed;
  } catch (e) {
    // JSON.parse failed – corrupted data
    console.warn("[BookingSession] Corrupt session data – clearing:", e);
    clearBookingSession();
    return null;
  }
}

/**
 * Remove the persisted session from localStorage.
 * Call this whenever the user changes their pickup or drop location.
 */
export function clearBookingSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore – nothing critical to clean up
  }
}
