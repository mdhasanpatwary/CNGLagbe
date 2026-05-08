import { prisma } from "./prisma";
import { BoundedCache } from "./bounded-cache";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}

// BoundedCache prevents unbounded memory growth from accumulating rate-limit keys
const rlCache = new BoundedCache<RateLimitResult>(2000); // 2s TTL

/**
 * Simple rate limiter using the database.
 * @param key The unique key to rate limit (e.g., "user:123:booking:active")
 * @param limit Max attempts allowed
 * @param windowSeconds Window in seconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  // 1. Check in-memory cache first (BoundedCache handles TTL)
  const cached = rlCache.get(key);
  if (cached) {
    // If it was already failing, return cached failure
    if (!cached.success) return cached;
    
    // If it was succeeding and remaining count is high enough, skip DB
    if (cached.remaining > 1) {
      return cached;
    }
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

  try {
    const record = await prisma.rateLimit.findUnique({
      where: { key },
    });

    let result: RateLimitResult;

    if (!record) {
      await prisma.rateLimit.create({
        data: {
          key,
          attempts: 1,
          lastAttempt: now,
          expiresAt,
        },
      });
      result = {
        success: true,
        limit,
        remaining: limit - 1,
        reset: expiresAt,
      };
    } else if (record.expiresAt < now) {
      // Expired, reset
      await prisma.rateLimit.update({
        where: { key },
        data: {
          attempts: 1,
          lastAttempt: now,
          expiresAt,
        },
      });
      result = {
        success: true,
        limit,
        remaining: limit - 1,
        reset: expiresAt,
      };
    } else if (record.attempts >= limit) {
      result = {
        success: false,
        limit,
        remaining: 0,
        reset: record.expiresAt,
      };
    } else {
      const updated = await prisma.rateLimit.update({
        where: { key },
        data: {
          attempts: { increment: 1 },
          lastAttempt: now,
        },
      });

      result = {
        success: true,
        limit: limit,
        remaining: limit - updated.attempts,
        reset: record.expiresAt,
      };
    }

    // Update in-memory cache
    rlCache.set(key, result);
    return result;

  } catch (error) {
    console.error("Rate limit error:", error);
    // Fail open if rate limiting fails
    return {
      success: true,
      limit,
      remaining: 1,
      reset: now,
    };
  }
}

/**
 * Compatibility wrapper for checkRateLimit
 */
export async function checkRateLimit(key: string, limit: number, windowSeconds: number) {
  const res = await rateLimit(key, limit, windowSeconds);
  return { allowed: res.success, ...res };
}

/**
 * Reset rate limit for a key
 */
export async function resetRateLimit(key: string) {
  try {
    rlCache.delete(key);
    await prisma.rateLimit.delete({ where: { key } }).catch(() => {});
  } catch {
    // Ignore if not exists
  }
}
