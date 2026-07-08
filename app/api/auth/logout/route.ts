import { NextResponse } from "next/server";
import { getCookieDomain } from "@/lib/subdomain";

const AUTH_COOKIE_NAME = "auth_token";

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true });
  
  // Clear auth cookies directly via response headers to avoid Next.js cookies() key-collision,
  // ensuring both host-only and legacy wildcard cookies are removed.
  const isProd = process.env.NODE_ENV === "production";
  
  // 1. Clear host-only cookie (no domain attribute)
  response.headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; ${isProd ? "Secure;" : ""} SameSite=Lax`
  );
  
  // 2. Clear legacy wildcard cookie if domain is configured
  const host = request.headers.get("host");
  const domain = getCookieDomain(host);
  if (domain) {
    response.headers.append(
      "Set-Cookie",
      `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; Domain=${domain}; HttpOnly; ${isProd ? "Secure;" : ""} SameSite=Lax`
    );
  }
  
  return response;
}
