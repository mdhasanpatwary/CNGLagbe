import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { type Metadata } from "next";
import DirectoryPageClient from "@/components/directory/DirectoryPageClient";
import Script from "next/script";

function getPhoneHash(phone: string): string {
  return createHash("sha256").update(phone).digest("hex");
}

export const metadata: Metadata = {
  title: "ড্রাইভার ডিরেক্টরি — ছাগলনাইয়ার সিএনজি ড্রাইভার তালিকা",
  description:
    "ছাগলনাইয়া ও ফেনীর সকল ভেরিফাইড সিএনজি এবং টোটো ড্রাইভারদের তালিকা। নাম, বাজার এবং ভেহিকেল নম্বর সহ। CNGLagbe — Verified CNG driver directory for Chhagalnaiya, Feni.",
  alternates: {
    canonical: "/directory",
  },
  openGraph: {
    title: "CNG Driver Directory — Chhagalnaiya & Feni | CNGLagbe",
    description:
      "Browse verified CNG and Toto drivers in Chhagalnaiya, Feni. Name, bazar location, and vehicle info for every active driver on CNGLagbe.",
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
    "Chhagalnaiya CNG driver list",
    "Feni CNG directory",
    "verified CNG drivers Bangladesh",
    "CNGLagbe driver directory",
  ],
};

export default async function Page() {
  const session = await getAuthUser();
  let user = null;

  if (session) {
    let userData = null;
    if (session.role === "USER" || session.role === "ADMIN") {
      userData = await prisma.user.findUnique({
        where: { id: session.sub },
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          photoUrl: true,
          birthday: true,
          createdAt: true,
        },
      });
    } else if (session.role === "DRIVER") {
      userData = await prisma.driver.findUnique({
        where: { id: session.sub },
        select: {
          id: true,
          name: true,
          phone: true,
          photoUrl: true,
          isApproved: true,
          isSuspended: true,
          isOnline: true,
          vehicleNumber: true,
          vehicleType: true,
          nearbyBazar: true,
          address: true,
          birthday: true,
          nidNumber: true,
          licenseNumber: true,
          createdAt: true,
        },
      });
    }

    if (userData) {
      user = {
        ...userData,
        role: session.role,
        phoneHash: userData.phone ? getPhoneHash(userData.phone) : null,
        createdAt: userData.createdAt.toISOString(),
        birthday: userData.birthday ? userData.birthday.toISOString() : null,
      };
    }
  }

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
      <DirectoryPageClient initialUser={user} />
    </>
  );
}

