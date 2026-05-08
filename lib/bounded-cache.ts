/**
 * A simple in-memory cache with TTL-based expiration and a hard size cap.
 * Prevents unbounded memory growth from Map-based caches.
 *
 * Usage:
 *   const cache = new BoundedCache<MyData>(5000); // 5s TTL
 *   cache.set("key", myData);
 *   const hit = cache.get("key"); // null if expired or missing
 */
export class BoundedCache<T> {
  private map = new Map<string, { data: T; ts: number }>();
  private readonly ttl: number;
  private readonly maxSize: number;
  private lastSweep = Date.now();
  private readonly sweepInterval = 60_000; // sweep stale entries every 60s

  constructor(ttlMs: number, maxSize = 10_000) {
    this.ttl = ttlMs;
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > this.ttl) {
      this.map.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T): void {
    // Periodic sweep of expired entries
    const now = Date.now();
    if (now - this.lastSweep > this.sweepInterval) {
      this.sweep(now);
    }

    // Hard cap: if at max, evict oldest entry
    if (this.map.size >= this.maxSize && !this.map.has(key)) {
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) {
        this.map.delete(firstKey);
      }
    }

    this.map.set(key, { data, ts: now });
  }

  delete(key: string): void {
    this.map.delete(key);
  }

  private sweep(now: number): void {
    this.lastSweep = now;
    for (const [k, v] of this.map) {
      if (now - v.ts > this.ttl) {
        this.map.delete(k);
      }
    }
  }
}
