/**
 * Centralized color palette for the CNGLagbe design system.
 * Use these constants for JS-based styling (e.g. Google Maps markers, Canvas)
 * to maintain consistency with the Tailwind CSS theme.
 */
export const COLORS = {
  // Brand Colors (Matches globals.css @theme)
  primary: "#16A34A",
  primaryLight: "#DCFCE7",
  primaryDark: "#166534",
  
  // Status Colors
  success: "#16A34A",
  successLight: "#DCFCE7",
  error: "#DC2626",
  errorDark: "#7F1D1D",
  errorLight: "#FEE2E2", // red-100
  
  // Map Specific (Semantic)
  pickup: "#16A34A",
  pickupBorder: "#15803D", // green-700
  drop: "#EF4444",         // red-500
  dropBorder: "#7F1D1D",   // red-900
  driver: "#2563EB",       // blue-600
  driverBorder: "#1D4ED8", // blue-700
  route: "#16A34A",
  
  // Generic / Utility
  white: "#FFFFFF",
  glyph: "#FFFFFF",
  warning: "#FFF3CD",      // For pending states
  warningDark: "#856404",
  warningLight: "#FEF9C3",
};
