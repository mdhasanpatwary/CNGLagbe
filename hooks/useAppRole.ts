"use client";

import { useState } from "react";
import { getAppRole, AppRole } from "@/lib/subdomain";

/**
 * Hook to detect the app role (user or driver) on the client side.
 * Relies on window.location.hostname.
 */
export function useAppRole() {
  const [role] = useState<AppRole>(() => {
    if (typeof window !== "undefined") {
      return getAppRole(window.location.hostname);
    }
    return "user";
  });

  return {
    role,
    isDriver: role === "driver",
    isUser: role === "user",
  };
}
