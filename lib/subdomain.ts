/**
 * Subdomain detection and URL generation utilities
 */

export const USER_DOMAIN = process.env.NEXT_PUBLIC_USER_DOMAIN || "cnglagbe.com";
export const DRIVER_DOMAIN = process.env.NEXT_PUBLIC_DRIVER_DOMAIN || "driver.cnglagbe.com";

const USER_DOMAIN_DEV = process.env.NEXT_PUBLIC_USER_DOMAIN_DEV || "localhost:3000";
const DRIVER_DOMAIN_DEV = process.env.NEXT_PUBLIC_DRIVER_DOMAIN_DEV || "driver.localhost:3000";

export type AppRole = "user" | "driver";

function getHostname(host: string | null): string {
  return (host || "").split(":")[0].toLowerCase();
}

/**
 * Detects the app context based on the hostname
 * @param host The hostname (e.g., from headers or window.location)
 * @returns AppRole
 */
export function getAppRole(host: string | null): AppRole {
  if (!host) return "user";
  
  // Clean port if present
  const hostname = getHostname(host);
  
  if (hostname.startsWith("driver.")) {
    return "driver";
  }
  
  // Check against dev domains explicitly if needed, but the .startsWith('driver.') is usually enough
  if (host === DRIVER_DOMAIN_DEV) {
    return "driver";
  }

  return "user";
}

/**
 * Checks if the current host is the driver subdomain
 */
export function isDriverApp(host: string | null): boolean {
  return getAppRole(host) === "driver";
}

/**
 * Generates a full URL for the user application
 */
export function getUserUrl(path: string = "/", isDev: boolean = process.env.NODE_ENV === "development"): string {
  const domain = isDev ? USER_DOMAIN_DEV : USER_DOMAIN;
  const protocol = isDev ? "http" : "https";
  return `${protocol}://${domain}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Generates a full URL for the driver application
 */
export function getDriverUrl(path: string = "/", isDev: boolean = process.env.NODE_ENV === "development"): string {
  const domain = isDev ? DRIVER_DOMAIN_DEV : DRIVER_DOMAIN;
  const protocol = isDev ? "http" : "https";
  return `${protocol}://${domain}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Checks whether the current request is on the configured production domains.
 * Vercel preview/demo URLs should keep cookies and redirects on their own host.
 */
export function isConfiguredProductionHost(host: string | null): boolean {
  const hostname = getHostname(host);
  const userDomain = getHostname(USER_DOMAIN);
  const driverDomain = getHostname(DRIVER_DOMAIN);

  return hostname === userDomain || hostname === driverDomain || hostname.endsWith(`.${userDomain}`);
}

/**
 * Gets the base domain for cross-subdomain cookies
 */
export function getCookieDomain(host?: string | null): string | undefined {
  if (process.env.NODE_ENV === "production" && isConfiguredProductionHost(host || null)) {
    return `.${USER_DOMAIN}`; // .cnglagbe.com
  }
  
  // In development, we usually can't share cookies between localhost and sub.localhost
  // unless we use a custom domain in /etc/hosts. 
  // Returning undefined defaults to the current host.
  return undefined;
}
