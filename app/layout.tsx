import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-bangla",
  display: "swap",
});

import { headers } from "next/headers";
import { getAppRole } from "@/lib/subdomain";

export async function generateViewport(): Promise<Viewport> {
  const headersList = await headers();
  const host = headersList.get("host");
  const role = getAppRole(host);
  const isDriver = role === "driver";
  
  return {
    themeColor: isDriver ? "#10B981" : "#16A34A", // Emerald for Driver, Green for User
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
    title: isDriver
      ? "CNGLagbe Driver | Manage Your Rides"
      : "CNG Booking in Chhagalnaiya | Fast, Fixed Fare, Local Service",
    description: isDriver
      ? "Manage your CNG rides — accept requests, navigate, and track your earnings."
      : "Book CNG instantly in Chhagalnaiya. 100+ local drivers, fixed fare, fast pickup. Cash payment available. CNG near me.",
    manifest: "/manifest.json",
    keywords: isDriver
      ? ["CNG driver", "CNGLagbe", "ride sharing Bangladesh"]
      : ["CNG booking Chhagalnaiya", "local auto rickshaw", "CNG near me", "fixed fare CNG", "চাঁগলনাইয়া CNG", "সিএনজি বুকিং"],
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
        ? "Manage your CNG rides."
        : "Book CNG instantly in Chhagalnaiya. 100+ local drivers, fixed fare, fast pickup.",
      locale: "bn_BD",
      type: "website",
    },
  };
}

import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("antialiased", inter.variable, notoBengali.variable)}>
      <body className="min-h-screen bg-slate-50 pb-safe font-sans relative">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
