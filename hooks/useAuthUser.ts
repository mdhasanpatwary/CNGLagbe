"use client";

import { useState, useEffect } from "react";
import { User } from "@/lib/types/user";

/**
 * Client-side hook to fetch the current authenticated user via /api/auth/me.
 * 
 * Replaces the server-side Prisma query that was blocking page render
 * (the DB round-trip to Supabase pooler was taking 1–70s on cold connections).
 * 
 * The page now renders instantly and user state fills in asynchronously.
 */
export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      // Quick check: if no auth cookie exists, skip the network request entirely.
      // This eliminates a wasted round-trip for the ~90% of visitors who are unauthenticated.
      const hasAuthCookie = document.cookie.split(";").some(c => c.trim().startsWith("auth_token="));
      if (!hasAuthCookie) {
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          if (!cancelled) {
            setUser(null);
            setIsLoading(false);
          }
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          if (data.authenticated && data.user) {
            // Normalize date fields to ISO strings for consistency with previous server-side serialization
            const u = data.user;
            setUser({
              ...u,
              createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
              birthday: u.birthday ? new Date(u.birthday).toISOString() : null,
            });
          } else {
            setUser(null);
          }
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const clearUser = () => setUser(null);

  return { user, setUser, isLoading, clearUser };
}
