import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const solaimanLipi = localFont({
  src: "../public/fonts/SolaimanLipi.woff",
  variable: "--font-bangla",
  display: "swap",
});

import { headers } from "next/headers";
import { getAppRole } from "@/lib/subdomain";
import { COLORS } from "@/constants/colors";

export async function generateViewport(): Promise<Viewport> {
  return {
    themeColor: COLORS.primary, // Primary Brand Color
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host");
  const role = getAppRole(host);
  const isDriver = role === "driver";
  
  return {
    metadataBase: new URL("https://www.cnglagbe.com"),
    title: isDriver
      ? "CNGLagbe Driver | Manage Your Bookings"
      : "CNG Booking in Chhagalnaiya | Fast, Fixed Fare, Local Service",
    description: isDriver
      ? "Manage your CNG bookings — accept requests, navigate, and track your earnings."
      : "Book CNG instantly in Chhagalnaiya. 100+ local drivers, fixed fare, fast pickup. Cash payment available. CNG near me.",
    manifest: "/manifest.json",
    keywords: isDriver
      ? ["CNG driver", "CNGLagbe", "booking service Bangladesh"]
      : ["CNG booking Chhagalnaiya", "local CNG", "CNG near me", "fixed fare CNG", "ছাগলনাইয়া CNG", "সিএনজি বুকিং"],
    appleWebApp: {
      capable: true,
      title: isDriver ? "CNG Driver" : "CNGLagbe",
      statusBarStyle: "default",
    },
    openGraph: {
      title: isDriver
        ? "CNGLagbe Driver"
        : "CNG Booking in Chhagalnaiya | Fast, Fixed Fare, Local Service",
      description: isDriver
        ? "Manage your CNG bookings."
        : "Book CNG instantly in Chhagalnaiya. 100+ local drivers, fixed fare, fast pickup.",
      locale: "bn_BD",
      type: "website",
    },
    icons: {
      icon: "/icon.png",
      apple: "/apple-icon.png",
    },
  };
}

import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";
import { Footer } from "@/components/layout/Footer";
import { Analytics } from "@vercel/analytics/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("antialiased", inter.variable, solaimanLipi.variable)}>
      <body className="min-h-screen bg-slate-50 pb-safe font-sans relative">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </div>
        </Providers>
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  );
}
