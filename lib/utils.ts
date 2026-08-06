import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizePhone(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("00880")) {
    cleaned = cleaned.substring(5);
  } else if (cleaned.startsWith("880") && cleaned.length === 13) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.length === 10 && /^1[3-9]/.test(cleaned)) {
    cleaned = "0" + cleaned;
  }
  return cleaned;
}

export function formatDecimal(value: number | string | undefined | null, maxDecimals = 2): string {
  if (value === undefined || value === null) return "0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  
  // Use Number.toLocaleString for cleaner formatting or just toFixed and parseFloat to remove trailing zeros
  return parseFloat(num.toFixed(maxDecimals)).toString();
}
