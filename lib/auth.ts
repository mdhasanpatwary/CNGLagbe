import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_local_dev";
const key = new TextEncoder().encode(JWT_SECRET);

export interface JwtPayload {
  sub: string; // driver or user ID
  role: "DRIVER" | "USER" | "ADMIN";
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d") // 30 days session
    .sign(key);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

import { getCookieDomain } from "./subdomain";

const AUTH_COOKIE_NAME = "auth_token";

/**
 * Sets the authentication cookie with cross-subdomain support
 */
export async function setAuthCookie(token: string, host?: string | null) {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  const domain = getCookieDomain(host);
  
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    ...(domain ? { domain } : {}),
  });
}

/**
 * Gets the token from cookies
 */
export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}

/**
 * Clears the authentication cookie
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

/**
 * Gets and verifies the current authenticated user
 */
export async function getAuthUser(): Promise<JwtPayload | null> {
  const token = await getAuthToken();
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Specifically ensures the authenticated user is a DRIVER
 */
export async function getAuthenticatedDriver(): Promise<string | null> {
  const user = await getAuthUser();
  if (!user || user.role !== "DRIVER") return null;
  return user.sub;
}

// Short-lived in-memory cache for driver approval status.
// Approval/suspension changes are rare admin actions, so a 30s cache
// eliminates ~95% of redundant DB queries on hot-path driver routes
// (location, requests, accept, complete, reject).
const approvalCache = new Map<string, { approved: boolean; ts: number }>();
const APPROVAL_CACHE_TTL = 30_000; // 30 seconds

/**
 * Specifically ensures the authenticated user is a DRIVER and is approved.
 * Uses a short-lived in-memory cache to avoid hitting DB on every call.
 */
export async function getApprovedDriver(): Promise<string | null> {
  const driverId = await getAuthenticatedDriver();
  if (!driverId) return null;

  // Check cache first
  const cached = approvalCache.get(driverId);
  if (cached && Date.now() - cached.ts < APPROVAL_CACHE_TTL) {
    return cached.approved ? driverId : null;
  }

  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: { isApproved: true, isSuspended: true },
  });

  const approved = !!driver?.isApproved && !driver.isSuspended;

  // Update cache
  approvalCache.set(driverId, { approved, ts: Date.now() });

  // Evict stale entries periodically (simple sweep when cache grows)
  if (approvalCache.size > 1000) {
    const now = Date.now();
    for (const [k, v] of approvalCache) {
      if (now - v.ts > APPROVAL_CACHE_TTL) approvalCache.delete(k);
    }
  }

  return approved ? driverId : null;
}

/**
 * Specifically ensures the authenticated user is an ADMIN
 */
export async function getAuthenticatedAdmin(): Promise<string | null> {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") return null;
  return user.sub;
}
