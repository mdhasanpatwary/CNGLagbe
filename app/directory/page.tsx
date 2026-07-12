import { type Metadata } from "next";
import DirectoryPageClient from "@/components/directory/DirectoryPageClient";
import Script from "next/script";

export const metadata: Metadata = {
  title: "ড্রাইভার ডিরেক্টরি — ছাগলনাইয়ার সিএনজি, টোটো ও অ্যাম্বুলেন্স ড্রাইভার তালিকা",
  description:
    "ছাগলনাইয়া ও ফেনীর সকল ভেরিফাইড সিএনজি, টোটো এবং অ্যাম্বুলেন্স ড্রাইভারদের তালিকা। নাম, বাজার এবং ভেহিকেল নম্বর সহ। CNGLagbe — Verified CNG, Toto and Ambulance driver directory for Chhagalnaiya, Feni.",
  alternates: {
    canonical: "/directory",
  },
  openGraph: {
    title: "CNG, Toto & Ambulance Driver Directory — Chhagalnaiya & Feni | CNGLagbe",
    description:
      "Browse verified CNG, Toto and Ambulance drivers in Chhagalnaiya, Feni. Name, bazar location, and vehicle info for every active driver on CNGLagbe.",
    url: "https://www.cnglagbe.com/directory",
    siteName: "CNGLagbe",
    images: [
      {
        url: "/hero_bg.png",
        width: 1200,
        height: 630,
        alt: "CNGLagbe Driver Directory — Chhagalnaiya, Feni",
      },
    ],
    locale: "bn_BD",
    type: "website",
  },
  keywords: [
    "ছাগলনাইয়া সিএনজি ড্রাইভার",
    "ফেনী সিএনজি ড্রাইভার তালিকা",
    "ছাগলনাইয়া অ্যাম্বুলেন্স",
    "জরুরী অ্যাম্বুলেন্স ফেনী",
    "Chhagalnaiya CNG driver list",
    "Feni CNG directory",
    "verified CNG drivers Bangladesh",
    "CNGLagbe driver directory",
    "Chhagalnaiya ambulance contact",
  ],
};

export default function Page() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.cnglagbe.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Driver Directory",
        item: "https://www.cnglagbe.com/directory",
      },
    ],
  };

  return (
    <>
      <Script
        id="schema-directory-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <DirectoryPageClient />
    </>
  );
}
