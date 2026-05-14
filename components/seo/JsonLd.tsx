"use client";

import React from "react";
import Script from "next/script";

/**
 * JsonLd Component
 * 
 * Injects structured data into the page for SEO, AEO, and GEO.
 * Includes:
 * - Organization: General brand information
 * - LocalBusiness: Targeting Chhagalnaiya, Feni region
 * - Service: Explicitly defining the "On-time CNG Booking Service"
 * - FAQPage: Structured representation of common user questions
 */
export const JsonLd = () => {
  const baseUrl = "https://www.cnglagbe.com";
  
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "CNGLagbe",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "description": "On-time CNG Booking Service in Chhagalnaiya, Feni. A lightweight dispatch network for fast and reliable transport.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Chhagalnaiya",
      "addressRegion": "Feni",
      "addressCountry": "BD"
    },
    "sameAs": [
      "https://www.facebook.com/profile.php?id=61588788704424",
      "https://www.facebook.com/groups/1323726679617004"
    ]
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "CNGLagbe",
    "image": `${baseUrl}/hero_bg.png`,
    "@id": baseUrl,
    "url": baseUrl,
    "telephone": "",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Chhagalnaiya Bazar",
      "addressLocality": "Chhagalnaiya",
      "addressRegion": "Feni",
      "postalCode": "3910",
      "addressCountry": "BD"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 23.0361,
      "longitude": 91.5203
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    },
    "sameAs": [
      "https://www.facebook.com/profile.php?id=61588788704424",
      "https://www.facebook.com/groups/1323726679617004"
    ]
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "CNG Booking Service",
    "provider": {
      "@type": "LocalBusiness",
      "name": "CNGLagbe"
    },
    "areaServed": {
      "@type": "AdministrativeArea",
      "name": "Chhagalnaiya Upazila"
    },
    "description": "On-time CNG Booking Service providing fast pickups and fixed fares via a lightweight local dispatch network.",
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "priceCurrency": "BDT"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I book a CNG in Chhagalnaiya?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can book a CNG instantly via CNGLagbe by entering your pickup and destination locations. A nearby verified driver will arrive within minutes."
        }
      },
      {
        "@type": "Question",
        "name": "Is the CNG fare fixed?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, CNGLagbe provides fixed fares shown upfront before you confirm your booking. No bargaining with drivers is required."
        }
      },
      {
        "@type": "Question",
        "name": "Are the drivers verified?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "All drivers on the CNGLagbe platform undergo a strict verification process, including NID and driver's license checks, ensuring a safe and reliable journey."
        }
      }
    ]
  };

  return (
    <>
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
    </>
  );
};
