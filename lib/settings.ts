import { prisma } from "./prisma";
import { BoundedCache } from "./bounded-cache";

// System settings change extremely rarely — cache for 5 minutes
// to avoid a DB round-trip on every write operation (e.g., contributed driver POST).
const settingsCache = new BoundedCache<string>(5 * 60 * 1000, 100);

export async function getSystemSetting(key: string, defaultValue: string): Promise<string> {
  const cached = settingsCache.get(key);
  if (cached !== null) return cached;

  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });
    const value = setting ? setting.value : defaultValue;
    settingsCache.set(key, value);
    return value;
  } catch (error) {
    console.error(`Error fetching system setting ${key}:`, error);
    return defaultValue;
  }
}

export async function getBookingTimeoutMinutes(): Promise<number> {
  const value = await getSystemSetting("BOOKING_REQUEST_TIMEOUT_MINUTES", "5");
  return parseFloat(value) || 5;
}
