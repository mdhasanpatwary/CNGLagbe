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
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  const domain = getCookieDomain();
  
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

/**
 * Specifically ensures the authenticated user is a DRIVER and is approved
 */
export async function getApprovedDriver(): Promise<string | null> {
  const driverId = await getAuthenticatedDriver();
  if (!driverId) return null;

  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: { isApproved: true, isSuspended: true },
  });

  if (!driver?.isApproved || driver.isSuspended) return null;
  return driverId;
}

/**
 * Specifically ensures the authenticated user is an ADMIN
 */
export async function getAuthenticatedAdmin(): Promise<string | null> {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") return null;
  return user.sub;
}
