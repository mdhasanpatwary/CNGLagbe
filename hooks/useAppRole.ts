"use client";

import { useEffect, useState } from "react";
import { getAppRole, AppRole } from "@/lib/subdomain";

/**
 * Hook to detect the app role (user or driver) on the client side.
 * Relies on window.location.hostname.
 */
export function useAppRole() {
  const [role, setRole] = useState<AppRole>("user");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      setRole(getAppRole(host));
    }
  }, []);

  return {
    role,
    isDriver: role === "driver",
    isUser: role === "user",
  };
}
