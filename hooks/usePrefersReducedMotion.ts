"use client";

import { useSyncExternalStore } from "react";

/**
 * Hook to track user preference for reduced motion.
 * Uses useSyncExternalStore for a safe, consistent subscription to media query changes.
 * 
 * @returns boolean indicating if the user prefers reduced motion
 */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {};
      
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      mediaQuery.addEventListener("change", callback);
      return () => mediaQuery.removeEventListener("change", callback);
    },
    () => {
      if (typeof window === "undefined") return false;
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    },
    () => false // Default for server-side
  );
}
