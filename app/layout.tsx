import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
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

  const baseUrl = "https://www.cnglagbe.com";
  const fullTitle = isDriver
    ? "CNGLagbe Driver | Manage Your Bookings"
    : "CNG Booking in Feni | Fast, Fixed Fare, Local Service";
  const fullDescription = isDriver
    ? "Manage your CNG bookings — accept requests, navigate, and track your earnings."
    : "Book CNG instantly in Feni. 100+ local drivers, fixed fare, fast pickup. Cash payment available. CNG near me.";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: fullTitle,
      template: "%s | CNGLagbe",
    },
    description: fullDescription,
    alternates: {
      canonical: "/",
    },
    manifest: "/manifest.json",
    keywords: isDriver
      ? ["CNG driver", "CNGLagbe", "booking service Bangladesh", "driver app", "CNG app"]
      : ["CNG booking Feni", "local CNG", "CNG near me", "fixed fare CNG", "ছাগলনাইয়া CNG", "সিএনজি বুকিং", "Feni transport", "Feni CNG"],
    appleWebApp: {
      capable: true,
      title: isDriver ? "CNG Driver" : "CNGLagbe",
      statusBarStyle: "default",
    },
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: baseUrl,
      siteName: "CNGLagbe",
      images: [
        {
          url: "/hero_bg.png",
          width: 1200,
          height: 630,
          alt: "CNGLagbe - On-time CNG Booking Service",
        },
      ],
      locale: "bn_BD",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: fullDescription,
      images: ["/hero_bg.png"],
    },
    icons: {
      icon: "/icon.png",
      apple: "/apple-icon.png",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: "YOUR_GOOGLE_VERIFICATION_CODE", // Replace with your actual code from Google Search Console
    },
  };
}

import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";
import { Footer } from "@/components/layout/Footer";
import { Analytics } from "@vercel/analytics/next";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("antialiased", inter.variable, notoSansBengali.variable)}>
      <body className="min-h-screen bg-slate-50 pb-safe font-sans relative">
        <NuqsAdapter>
          <Providers>
            <div className="flex flex-col min-h-screen">
              <div className="flex-1">
                {children}
              </div>
              <Footer />
            </div>
          </Providers>
        </NuqsAdapter>
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  );
}
