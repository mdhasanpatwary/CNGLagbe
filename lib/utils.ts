import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizePhone(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("880")) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.length === 10 && !cleaned.startsWith("0")) {
    cleaned = "0" + cleaned;
  }
  return cleaned;
}
