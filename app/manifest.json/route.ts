import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAppRole } from "@/lib/subdomain";
import { TEXT } from "@/constants/text";

/**
 * Dynamic PWA manifest route handler.
 * Serves different manifests for driver.cnglagbe.com vs cnglagbe.com.
 * Supports bilingual content based on the app-lang cookie.
 */
export async function GET(request: Request) {
  const host = request.headers.get("host");
  const role = getAppRole(host);
  
  const cookieStore = await cookies();
  const lang = (cookieStore.get("app-lang")?.value || "en") as "en" | "bn";

  const isDriver = role === "driver";
  
  // Localized strings from the central TEXT dictionary
  const name = isDriver 
    ? `${TEXT.app_name[lang]} ${TEXT.driver_portal[lang]}` 
    : TEXT.app_name[lang];
    
  const shortName = isDriver 
    ? TEXT.driver_portal[lang] 
    : TEXT.app_name[lang];
    
  const description = isDriver 
    ? TEXT.signin_desc[lang] 
    : TEXT.cng_desc[lang];

  const manifest = {
    name,
    short_name: shortName,
    description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#10b981",
    icons: isDriver ? [
      {
        src: "/icons/driver-icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any maskable"
      }
    ] : [
      {
        src: "/icons/user-icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any maskable"
      }
    ]
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
