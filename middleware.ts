import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getAppRole, getUserUrl, getDriverUrl } from "@/lib/subdomain";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get("host");
  const appRole = getAppRole(host);
  const path = url.pathname;

  // 1. Skip paths that should bypass middleware
  if (
    path.startsWith("/_next") ||
    path.startsWith("/static") ||
    path.startsWith("/login") ||
    path.startsWith("/signup") || // in case driver signup is here
    path.includes(".") ||
    path === "/manifest.json" ||
    path.startsWith("/api/auth") // auth endpoints
  ) {
    return NextResponse.next();
  }

  // 2. Auth checking
  const token = request.cookies.get("auth_token")?.value;
  const user = token ? await verifyToken(token) : null;

  // 3. API Routes Protection
  if (path.startsWith("/api")) {
    if (path.startsWith("/api/driver")) {
      if (!user || user.role !== "DRIVER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else if (path.startsWith("/api/user")) {
      if (!user || user.role !== "USER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    // Allow other API routes natively (e.g. /api/nearby-drivers, /api/fare, /api/geocode)
    return NextResponse.next();
  }

  // 4. Subdomain enforcement and role-based redirects
  if (appRole === "driver") {
    // If no user, redirect to login for Driver subdomain
    if (!user) {
      return NextResponse.redirect(getDriverUrl("/login"));
    }

    // If a user with role USER is on driver subdomain, send them back
    if (user.role === "USER") {
      return NextResponse.redirect(getUserUrl("/"));
    }

    // If authenticated driver lands on root driver subdomain, send them to dashboard
    if (user.role === "DRIVER" && path === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Rewrite logic: if on driver subdomain, and path doesn't start with /driver, 
    // it's likely a clean URL like /dashboard that should map to /driver/dashboard
    if (!path.startsWith("/driver") && !path.startsWith("/admin")) {
      url.pathname = `/driver${path === "/" ? "" : path}`;
      return NextResponse.rewrite(url);
    }
  } else {
    // User context (root domain)
    
    // If a user with role DRIVER is on user domain, send them to driver subdomain
    if (user && user.role === "DRIVER") {
      // If they were trying to access a driver path specifically
      if (path.startsWith("/driver")) {
        const cleanPath = path.replace("/driver", "") || "/";
        return NextResponse.redirect(getDriverUrl(cleanPath));
      }
      return NextResponse.redirect(getDriverUrl("/dashboard"));
    }

    if (!user) {
      if (path.startsWith("/user/") || path === "/map" || path === "/history") {
        return NextResponse.redirect(getUserUrl("/login"));
      }
    }

    // Don't allow /driver paths on the main domain; redirect to driver subdomain
    if (path.startsWith("/driver")) {
      const cleanPath = path.replace("/driver", "") || "/";
      return NextResponse.redirect(getDriverUrl(cleanPath));
    }
    
    // Optional: map /map to /user/map for cleaner user URLs
    if (path === "/map") {
      url.pathname = "/user/map";
      return NextResponse.rewrite(url);
    }
    if (path === "/history") {
      url.pathname = "/user/history";
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
