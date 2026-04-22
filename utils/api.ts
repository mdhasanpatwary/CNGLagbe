/**
 * apiFetch is a resilient wrapper around the native fetch API.
 * Features:
 * 1. Automatic retries on transient 5xx server errors.
 * 2. Idempotency key injection for mutating requests (POST, PUT, DELETE).
 * 3. Exponential backoff for retries.
 */

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = options.method?.toUpperCase() || "GET";
  const mutatingMethods = ["POST", "PUT", "PATCH", "DELETE"];
  const isMutation = mutatingMethods.includes(method);

  // Prepare headers
  const headers = new Headers(options.headers || {});
  
  // Generate a unique idempotency key for this specific request attempt bundle
  // If the request is retried, it will use the SAME key.
  // If the user initiates a separate call, it will get a NEW key.
  const idempotencyKey = crypto.randomUUID();

  if (isMutation && !headers.has("X-Idempotency-Key")) {
    headers.set("X-Idempotency-Key", idempotencyKey);
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 500ms, 1000ms, 2000ms
        const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        console.warn(`[apiFetch] Retry attempt ${attempt}/${MAX_RETRIES} for ${url} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Only retry on transient server errors (502, 503, 504)
      const transientStatuses = [502, 503, 504];
      if (transientStatuses.includes(response.status) && attempt < MAX_RETRIES) {
        console.warn(`[apiFetch] Transient server error ${response.status} on ${url} (attempt ${attempt + 1}/${MAX_RETRIES + 1}). Retrying...`);
        continue;
      }

      // Return the response for success (2xx) or client errors (4xx)
      return response;
    } catch (error) {
      lastError = error;
      
      // Retry on network errors
      if (attempt < MAX_RETRIES) {
        console.warn(`[apiFetch] Network error on ${url} (attempt ${attempt + 1}/${MAX_RETRIES + 1}). Retrying...`);
        continue;
      } else {
        console.error(`[apiFetch] Network error or exception on ${url}:`, error);
      }
    }
  }

  // If we reach here, we've exhausted all retries
  throw lastError || new Error(`Request failed after ${MAX_RETRIES} retries`);
}
