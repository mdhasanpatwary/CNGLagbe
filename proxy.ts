import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getAppRole, getUserUrl, getDriverUrl, isConfiguredProductionHost } from "@/lib/subdomain";

export async function proxy(request: NextRequest) {
  console.log(`[Proxy] Request: ${request.nextUrl.pathname}`);
  const url = request.nextUrl.clone();
  const host = request.headers.get("host");
  const appRole = getAppRole(host);
  const path = url.pathname;
  const useConfiguredDomains = process.env.NODE_ENV === "production" && isConfiguredProductionHost(host);
  const userUrl = (targetPath: string) =>
    useConfiguredDomains ? getUserUrl(targetPath) : new URL(targetPath, request.url);
  const driverUrl = (targetPath: string) =>
    useConfiguredDomains
      ? getDriverUrl(targetPath)
      : new URL(appRole === "driver" ? targetPath : `/driver${targetPath === "/" ? "" : targetPath}`, request.url);

  // 1. Skip static paths that should bypass middleware entirely
  if (
    path.startsWith("/_next") ||
    path.startsWith("/static") ||
    path.includes(".") ||
    path === "/manifest.json"
  ) {
    return NextResponse.next();
  }

  // 2. Production Restriction: Only allow landing page and API
  if (process.env.NODE_ENV === "production" && path !== "/" && !path.startsWith("/api")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 3. Auth checking
  const token = request.cookies.get("auth_token")?.value;
  const user = token ? await verifyToken(token) : null;

  // 4. API Routes Protection
  if (path.startsWith("/api")) {
    if (path.startsWith("/api/driver")) {
      if (!user || user.role !== "DRIVER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else if (path.startsWith("/api/user")) {
      if (!user || (user.role !== "USER" && user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else if (path.startsWith("/api/admin")) {
      if (path === "/api/admin/auth/login") {
        return NextResponse.next();
      }
      if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    // Allow other API routes natively (e.g. /api/nearby-drivers, /api/fare, /api/geocode, /api/auth)
    return NextResponse.next();
  }

  // 5. Auth Pages (Login/Signup) logic
  const isAuthPage = path.startsWith("/login") || path.startsWith("/signup") || path.startsWith("/driver/login") || path.startsWith("/driver/signup");
  
  // 6. Subdomain enforcement and role-based redirects
  if (appRole === "driver") {
    // If authenticated driver lands on root driver subdomain, send them to dashboard
    if (user?.role === "DRIVER" && path === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // If no user and not on an auth page, redirect to login for Driver subdomain
    if (!user && !isAuthPage) {
      return NextResponse.redirect(driverUrl("/login"));
    }

    // If a user with role USER is on driver subdomain, send them back to user site
    if (user?.role === "USER") {
      return NextResponse.redirect(userUrl("/"));
    }

    // Rewrite logic: if on driver subdomain, and path doesn't start with /driver, 
    // it's likely a clean URL like /dashboard or /login that should map to /driver/dashboard or /driver/login
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
        return NextResponse.redirect(driverUrl(cleanPath));
      }
      return NextResponse.redirect(driverUrl("/dashboard"));
    }

    // Allow ADMIN to access the root page as well.
    // If you want to redirect them, do it explicitly from the UI or let them navigate.

    // If not logged in and trying to access protected user paths
    if (!user && !isAuthPage) {
      if (path.startsWith("/user/") || path === "/map" || path === "/history") {
        return NextResponse.redirect(userUrl("/login"));
      }
    }

    // Don't allow /driver paths on the main domain; redirect to driver subdomain
    if (path.startsWith("/driver") && useConfiguredDomains) {
      const cleanPath = path.replace("/driver", "") || "/";
      return NextResponse.redirect(driverUrl(cleanPath));
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
    
    // Admin protection
    if (path.startsWith("/admin")) {
      if (path === "/admin/login") {
        return NextResponse.next();
      }
      if (!user || user.role !== "ADMIN") {
        return NextResponse.redirect(userUrl("/admin/login"));
      }
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
