// Example Redis caching for driver requests (optional)
// Install redis: npm install redis
// Add to lib/redis.ts or similar

import { Redis } from 'redis';

const redis = new Redis(process.env.REDIS_URL!);

export async function getCachedDriverRequests(driverId: string) {
  const cacheKey = `driver_requests:${driverId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  return null;
}

export async function setCachedDriverRequests(driverId: string, data: unknown) {
  const cacheKey = `driver_requests:${driverId}`;
  await redis.setex(cacheKey, 10, JSON.stringify(data)); // TTL 10 seconds
}

// In the API handler, wrap the logic:
const cached = await getCachedDriverRequests(driverId);
if (cached) {
  return NextResponse.json(cached);
}
// ... compute requests ...
await setCachedDriverRequests(driverId, { requests, currentBooking });
return NextResponse.json({ requests, currentBooking });