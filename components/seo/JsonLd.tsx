"use client";

import React from "react";
import Script from "next/script";

/**
 * JsonLd Component
 *
 * Injects structured data into the page for SEO, AEO, and GEO.
 *
 * Schemas included:
 * - WebSite        → sitelinks search box signal
 * - Organization   → brand entity (founding, contact, social)
 * - LocalBusiness  → geo-targeted local search (Google Maps, AI local answers)
 * - Service        → explicit service-type definition
 * - FAQPage        → 8 Q&As for snippet extraction (AEO/voice assistants)
 * - HowTo          → step-by-step booking process (rich result eligible)
 * - SpeakableSpec  → voice assistant (Google Assistant, Siri) optimization
 */
export const JsonLd = () => {
  const baseUrl = "https://www.cnglagbe.com";
  const phone = "01783721411";

  // ── 1. WebSite ────────────────────────────────────────────────────────────
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    "name": "CNGLagbe",
    "url": baseUrl,
    "description": "ছাগলনাইয়া ও ফেনীর অন-টাইম সিএনজি বুকিং সার্ভিস — On-time CNG Booking Service",
    "inLanguage": ["bn-BD", "en-BD"],
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/directory?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // ── 2. Organization ───────────────────────────────────────────────────────
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    "name": "CNGLagbe",
    "alternateName": "সিএনজি লাগবে",
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/logo.png`,
      "width": 300,
      "height": 80,
    },
    "description":
      "CNGLagbe is an on-time CNG booking service operating in Chhagalnaiya Upazila, Feni, Bangladesh. We provide fast, fixed-fare CNG transport via a lightweight local dispatch network of verified drivers.",
    "foundingDate": "2025",
    "areaServed": {
      "@type": "AdministrativeArea",
      "name": "Chhagalnaiya Upazila, Feni, Bangladesh",
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": `+880${phone}`,
      "contactType": "customer service",
      "availableLanguage": ["Bengali", "English"],
      "hoursAvailable": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday", "Tuesday", "Wednesday", "Thursday",
          "Friday", "Saturday", "Sunday",
        ],
        "opens": "06:00",
        "closes": "22:00",
      },
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Chhagalnaiya",
      "addressRegion": "Feni",
      "addressCountry": "BD",
    },
    "sameAs": [
      "https://www.facebook.com/profile.php?id=61588788704424",
      "https://www.facebook.com/groups/1323726679617004",
    ],
  };

  // ── 3. LocalBusiness ─────────────────────────────────────────────────────
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${baseUrl}/#localbusiness`,
    "name": "CNGLagbe — সিএনজি বুকিং সার্ভিস",
    "image": `${baseUrl}/hero_bg.png`,
    "url": baseUrl,
    "telephone": `+880${phone}`,
    "priceRange": "৳৳",
    "currenciesAccepted": "BDT",
    "paymentAccepted": "Cash",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Chhagalnaiya Bazar",
      "addressLocality": "Chhagalnaiya",
      "addressRegion": "Feni",
      "postalCode": "3910",
      "addressCountry": "BD",
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 23.0361,
      "longitude": 91.5203,
    },
    "hasMap": "https://maps.google.com/?q=23.0361,91.5203",
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday", "Tuesday", "Wednesday", "Thursday",
        "Friday", "Saturday", "Sunday",
      ],
      "opens": "06:00",
      "closes": "22:00",
    },
    "sameAs": [
      "https://www.facebook.com/profile.php?id=61588788704424",
      "https://www.facebook.com/groups/1323726679617004",
    ],
  };

  // ── 4. Service ────────────────────────────────────────────────────────────
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "On-time CNG Booking Service",
    "alternateName": "অন-টাইম সিএনজি বুকিং সার্ভিস",
    "serviceType": "CNG Auto-Rickshaw Booking",
    "category": "Local Transport",
    "provider": {
      "@type": "LocalBusiness",
      "name": "CNGLagbe",
      "@id": `${baseUrl}/#localbusiness`,
    },
    "areaServed": [
      {
        "@type": "City",
        "name": "Chhagalnaiya",
        "containedInPlace": {
          "@type": "AdministrativeArea",
          "name": "Feni District, Bangladesh",
        },
      },
      { "@type": "Place", "name": "Boktarhat" },
      { "@type": "Place", "name": "Shubopur" },
    ],
    "description":
      "Fixed-fare, on-time CNG auto-rickshaw booking for Chhagalnaiya Upazila, Feni. Passengers call or message to book. A verified local driver arrives within 5–10 minutes. Cash payment only.",
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "priceCurrency": "BDT",
      "priceSpecification": {
        "@type": "PriceSpecification",
        "priceCurrency": "BDT",
        "description": "Fixed fare calculated by distance. Minimum platform fee 10 BDT.",
      },
    },
  };

  // ── 5. FAQPage (8 AEO-optimized questions) ───────────────────────────────
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I book a CNG in Chhagalnaiya?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text":
            "Call CNGLagbe at 01783721411. Tell the operator your pickup location and destination in Chhagalnaiya or Feni. The operator will confirm the fixed fare and dispatch the nearest available verified driver. The driver typically arrives within 5–10 minutes.",
        },
      },
      {
        "@type": "Question",
        "name": "Is the CNG fare fixed or negotiable?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text":
            "The fare is fully fixed on CNGLagbe. Before the driver is dispatched, the operator calculates the exact fare based on distance. No bargaining with drivers is needed. The same fare you are told over the phone is what you pay in cash at the end of the trip.",
        },
      },
      {
        "@type": "Question",
        "name": "How long does it take to get a CNG after booking?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text":
            "After confirming your booking by phone, a CNGLagbe driver typically arrives at your pickup location within 5 to 10 minutes in Boktarhat and Shubopur (full service zones). Availability across the rest of Chhagalnaiya Upazila may vary.",
        },
      },
      {
        "@type": "Question",
        "name": "Are CNGLagbe drivers safe and verified?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text":
            "Yes. Every driver on the CNGLagbe platform is verified with their NID (National ID) and driver's license before being approved. Only local, approved drivers are allowed to accept bookings.",
        },
      },
      {
        "@type": "Question",
        "name": "How do I pay for a CNG booked through CNGLagbe?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text":
            "Payment is cash only. After the trip is completed, you pay the driver directly in cash. CNGLagbe does not process any digital or online payments.",
        },
      },
      {
        "@type": "Question",
        "name": "Which areas in Feni does CNGLagbe serve?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text":
            "CNGLagbe provides full service in Boktarhat and Shubopur. Partial service is available across all other areas of Chhagalnaiya Upazila, Feni district, Bangladesh.",
        },
      },
      {
        "@type": "Question",
        "name": "Can I contact CNGLagbe on Facebook?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text":
            "Yes. You can message CNGLagbe on Facebook at https://m.me/61588788704424 or join the community group at https://www.facebook.com/groups/1323726679617004. For fastest booking, call 01783721411 directly.",
        },
      },
      {
        "@type": "Question",
        "name": "What types of vehicles does CNGLagbe offer?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text":
            "CNGLagbe dispatches CNG auto-rickshaws (three-wheeler, green body) and Toto (battery-powered auto-rickshaws), and provides a directory of local emergency Ambulance drivers. These are common transport vehicles in the Chhagalnaiya, Feni area of Bangladesh.",
        },
      },
    ],
  };

  // ── 6. HowTo — Booking a CNG step-by-step ────────────────────────────────
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Book a CNG in Chhagalnaiya via CNGLagbe",
    "description":
      "Step-by-step guide to booking a CNG auto-rickshaw in Chhagalnaiya or Feni through the CNGLagbe dispatch service.",
    "totalTime": "PT5M",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "BDT",
      "value": "Fixed fare based on distance",
    },
    "tool": [
      { "@type": "HowToTool", "name": "Mobile phone" },
    ],
    "step": [
      {
        "@type": "HowToStep",
        "position": 1,
        "name": "Call the booking hotline",
        "text": "Call CNGLagbe at 01783721411 from your mobile phone.",
        "url": `${baseUrl}/#hero`,
      },
      {
        "@type": "HowToStep",
        "position": 2,
        "name": "Tell the operator your pickup and destination",
        "text":
          "Tell the operator where you are (pickup location) and where you want to go (destination) within Chhagalnaiya or Feni.",
      },
      {
        "@type": "HowToStep",
        "position": 3,
        "name": "Confirm the fixed fare",
        "text":
          "The operator will calculate and tell you the exact fixed fare. Confirm that you agree to the fare.",
      },
      {
        "@type": "HowToStep",
        "position": 4,
        "name": "Wait for the driver",
        "text":
          "A verified local CNG driver will be dispatched immediately. The driver typically arrives at your pickup location within 5–10 minutes.",
      },
      {
        "@type": "HowToStep",
        "position": 5,
        "name": "Pay cash at trip completion",
        "text":
          "After the trip ends at your destination, pay the driver the agreed fare in cash. No digital payment needed.",
      },
    ],
  };

  // ── 7. SpeakableSpecification (voice assistant optimization) ─────────────
  const speakableSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${baseUrl}/#webpage`,
    "url": baseUrl,
    "name": "CNGLagbe — On-time CNG Booking Service in Chhagalnaiya, Feni",
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": ["h1", ".speakable-description"],
    },
  };

  return (
    <>
      <Script
        id="schema-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Script
        id="schema-org"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="schema-local-business"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <Script
        id="schema-service"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <Script
        id="schema-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="schema-howto"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <Script
        id="schema-speakable"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(speakableSchema) }}
      />
    </>
  );
};
