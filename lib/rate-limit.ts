import { prisma } from "./prisma";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}

// Simple in-memory cache for rate limits to reduce DB load
const rlCache = new Map<string, { result: RateLimitResult; timestamp: number }>();
const CACHE_TTL_MS = 2000; // 2 seconds

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
  // 1. Check in-memory cache first
  const cached = rlCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    // If it was already failing, return cached failure
    if (!cached.result.success) return cached.result;
    
    // If it was succeeding, we still hit the DB to increment, 
    // but only if we haven't hit it in the last 2 seconds.
    // However, for high-frequency polling, we can actually "soft-success"
    // if the remaining count was high enough.
    if (cached.result.remaining > 1) {
      return cached.result;
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
    rlCache.set(key, { result, timestamp: Date.now() });
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
