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

export const viewport: Viewport = {
  themeColor: "#16A34A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "CNGLagbe",
  description: "Fixed fare rural CNG booking system",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "CNGLagbe",
    statusBarStyle: "default",
  },
};

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
