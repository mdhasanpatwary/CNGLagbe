import { prisma } from "./prisma";

/**
 * Checks if a key has exceeded the rate limit.
 * @param key The unique key to track (e.g., "login:017123...")
 * @param limit Maximum number of attempts
 * @param windowSeconds Time window in seconds
 * @returns Object with { allowed: boolean, remaining: number, resetPromise?: Promise<void> }
 */
export async function checkRateLimit(
  key: string,
  limit: number = 5,
  windowSeconds: number = 900 // 15 minutes default
) {
  const now = new Date();
  
  // Cleanup expired entries occasionally (could be a cron, but here we do it ad-hoc)
  // or just filter them out in the query.
  
  const record = await prisma.rateLimit.findUnique({
    where: { key },
  });

  if (!record || record.expiresAt < now) {
    // No record or expired, create/reset it
    await prisma.rateLimit.upsert({
      where: { key },
      create: {
        key,
        attempts: 1,
        expiresAt: new Date(now.getTime() + windowSeconds * 1000),
      },
      update: {
        attempts: 1,
        lastAttempt: now,
        expiresAt: new Date(now.getTime() + windowSeconds * 1000),
      },
    });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.attempts >= limit) {
    return { allowed: false, remaining: 0 };
  }

  // Increment attempts
  const updated = await prisma.rateLimit.update({
    where: { key },
    data: {
      attempts: { increment: 1 },
      lastAttempt: now,
    },
  });

  return { 
    allowed: true, 
    remaining: limit - updated.attempts 
  };
}

/**
 * Resets the rate limit for a key (usually after successful login)
 */
export async function resetRateLimit(key: string) {
  try {
    await prisma.rateLimit.delete({
      where: { key },
    });
  } catch (error) {
    // Ignore error if already deleted
  }
}
