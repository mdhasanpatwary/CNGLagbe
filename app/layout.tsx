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
    ? "CNGLagbe Driver | বুকিং ম্যানেজ করুন"
    : "ছাগলনাইয়া সিএনজি বুকিং | CNGLagbe — ফিক্সড ভাড়া, দ্রুত পিকআপ";
  const fullDescription = isDriver
    ? "CNGLagbe ড্রাইভার অ্যাপ — বুকিং রিকোয়েস্ট গ্রহণ করুন, নেভিগেট করুন এবং আপনার আয় ট্র্যাক করুন।"
    : "ছাগলনাইয়া ও ফেনীতে সিএনজি বুক করুন। ১০০+ লোকাল ড্রাইভার, ফিক্সড ভাড়া, দ্রুত পিকআপ। ক্যাশ পেমেন্ট। CNGLagbe — On-time CNG Booking Service in Chhagalnaiya, Feni.";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: fullTitle,
      template: "%s | CNGLagbe",
    },
    description: fullDescription,
    alternates: {
      canonical: "/",
      languages: {
        "bn-BD": "/",
        "en-BD": "/",
      },
    },
    manifest: "/manifest.json",
    keywords: isDriver
      ? [
          "CNG driver app", "CNGLagbe driver", "সিএনজি ড্রাইভার",
          "CNG booking Bangladesh", "driver earnings tracker", "Feni CNG driver",
        ]
      : [
          // Bengali keywords
          "ছাগলনাইয়া সিএনজি", "সিএনজি বুকিং", "ফেনী সিএনজি",
          "বক্তারহাট সিএনজি", "শুভপুর সিএনজি", "সিএনজি ডাকুন",
          // Transliterated
          "Chhagalnaiya CNG", "Boktarhat CNG", "Shubopur CNG",
          // English
          "CNG booking Feni", "local CNG Feni", "CNG near me Chhagalnaiya",
          "fixed fare CNG", "CNG auto Feni", "Feni transport",
          "on-time CNG booking", "CNG booking Bangladesh",
        ],
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
          alt: "CNGLagbe — ছাগলনাইয়া ও ফেনীর অন-টাইম সিএনজি বুকিং সার্ভিস",
        },
      ],
      locale: "bn_BD",
      alternateLocale: "en_BD",
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
    // Geo signals for local SEO (Chhagalnaiya, Feni, Bangladesh)
    other: {
      "geo.region": "BD-B", // Bangladesh, Chattogram division
      "geo.placename": "Chhagalnaiya, Feni, Bangladesh",
      "geo.position": "23.0361;91.5203",
      "ICBM": "23.0361, 91.5203",
    },
    verification: {
      google: "QUvDEB6cKjtuZcy_EQO5YT6ym21KXjplD2kuT1d2j90",
    },
  };
}

import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";
import { Footer } from "@/components/layout/Footer";
import { Analytics } from "@vercel/analytics/next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { InstallAppBanner } from "@/components/landing/InstallAppBanner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={cn("antialiased", inter.variable, notoSansBengali.variable)}>
      <body className="min-h-screen bg-slate-50 pb-safe font-sans relative">
        <NuqsAdapter>
          <Providers>
            <div className="flex flex-col min-h-screen">
              <div className="flex-1">
                {children}
              </div>
              <Footer />
            </div>
            <InstallAppBanner />
          </Providers>
        </NuqsAdapter>
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  );
}
