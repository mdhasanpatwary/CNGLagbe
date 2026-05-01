/**
 * Simplifies a Google Maps formatted address for easier reading by drivers.
 * Removes Plus Codes (e.g., 4F2P+HG9), redundant country names, and zip codes.
 */
export function simplifyAddress(address: string | null | undefined): string {
  if (!address) return "";

  // 1. Remove Plus Codes (e.g., "4F2P+HG9, ")
  // Pattern: alphanumeric, plus sign, alphanumeric
  let simplified = address.replace(/^[A-Z0-9]{4,8}\+[A-Z0-9]{2,4},\s*/, "");

  // 2. Remove "Bangladesh"
  simplified = simplified.replace(/,?\s*Bangladesh\s*$/i, "");

  // 3. Remove common redundant parts
  simplified = simplified.replace(/,?\s*\d{4}\s*$/i, ""); // Zip codes

  // 4. If the address is too long, take the first two meaningful parts
  // (Usually: House/Road, Area)
  const parts = simplified.split(",").map(p => p.trim()).filter(Boolean);
  if (parts.length > 2) {
    // Keep first 2-3 parts depending on length
    return parts.slice(0, 2).join(", ");
  }

  return simplified || address;
}
