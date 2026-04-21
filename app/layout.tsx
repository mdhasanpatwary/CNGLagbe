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
    title: isDriver ? "CNGLagbe Driver" : "CNGLagbe",
    description: isDriver ? "Manage your CNG rides" : "Fixed fare rural CNG booking system",
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      title: isDriver ? "CNG Driver" : "CNGLagbe",
      statusBarStyle: "default",
    },
  };
}

import { LanguageProvider } from "@/context/LanguageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("antialiased", inter.variable, notoBengali.variable)}>
      <body className="min-h-screen bg-slate-50 pb-safe font-sans relative">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
