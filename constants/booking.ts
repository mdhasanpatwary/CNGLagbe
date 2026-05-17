export const BOOKING_REQUEST_TIMEOUT_MINUTES = 5;
export const BOOKING_REQUEST_TIMEOUT_SECONDS = BOOKING_REQUEST_TIMEOUT_MINUTES * 60;
export const BOOKING_REQUEST_TIMEOUT_MS = BOOKING_REQUEST_TIMEOUT_SECONDS * 1000;

export function getBookingRequestTimeoutThreshold(minutes = BOOKING_REQUEST_TIMEOUT_MINUTES, now = Date.now()) {
  return new Date(now - (minutes * 60 * 1000));
}
