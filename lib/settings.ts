import { prisma } from "./prisma";

export async function getSystemSetting(key: string, defaultValue: string): Promise<string> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });
    return setting ? setting.value : defaultValue;
  } catch (error) {
    console.error(`Error fetching system setting ${key}:`, error);
    return defaultValue;
  }
}

export async function getBookingTimeoutMinutes(): Promise<number> {
  const value = await getSystemSetting("BOOKING_REQUEST_TIMEOUT_MINUTES", "5");
  return parseFloat(value) || 5;
}
