"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, ExternalLink, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "@/hooks/useLang";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface FooterProps {
  showMobileCTAOffset?: boolean;
  className?: string;
}

export function Footer({ showMobileCTAOffset, className }: FooterProps) {
  const { t } = useLang();
  const pathname = usePathname();

  // Do not render footer on map pages
  if (pathname === "/user/map") return null;

  // Automatically show offset on landing page if not explicitly provided
  const effectiveShowOffset = showMobileCTAOffset ?? pathname === "/";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const }
    }
  };

  return (
    <footer
      id="footer"
      className={cn(
        "bg-slate-900 text-slate-300 px-4 sm:px-6 md:px-8 pt-16 pb-8 border-t border-slate-800",
        effectiveShowOffset && "pb-28 md:pb-8", // Extra padding on mobile to account for sticky CTA
        className
      )}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-[1200px] mx-auto w-full"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 w-full">
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-6">
              <Image
                src="/logo_white.png"
                alt="CNGLagbe logo - On-time CNG booking service for Chhagalnaiya"
                width={300}
                height={80}
                sizes="(max-width: 768px) 300px, 300px"
                loading="lazy"
                className="h-15 w-auto object-contain"
              />
            </div>
            <p className="text-base font-normal font-bn leading-relaxed max-w-md text-slate-400">
              {t("footer_about_text")}
            </p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h4 className="text-white font-semibold text-base mb-4 uppercase tracking-wider">
              {t("footer_about")}
            </h4>
            <ul className="space-y-3 text-base">
              <li>
                <Link
                  href="/login"
                  className="hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-900 inline-flex items-center py-3 rounded-md min-h-[44px]"
                >
                  {t("user_login")}
                </Link>
              </li>
              <li>
                <Link
                  href="/driver/login"
                  className="hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-900 inline-flex items-center py-3 rounded-md min-h-[44px]"
                >
                  {t("driver_login")}
                </Link>
              </li>
            </ul>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h4 className="text-white font-semibold text-base mb-4 uppercase tracking-wider">
              {t("footer_contact")}
            </h4>
            <ul className="space-y-3 text-base">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{t("location_upazila")}</span>
              </li>
            </ul>

            <h4 className="text-white font-semibold text-base mt-8 mb-4 uppercase tracking-wider">
              {t("explore")}
            </h4>
            <ul className="space-y-3 text-base">
              <li>
                <a
                  href="https://www.facebook.com/profile.php?id=61588788704424"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors duration-200 inline-flex items-center gap-2 py-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t("facebook_page")}
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/groups/1323726679617004"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors duration-200 inline-flex items-center gap-2 py-2"
                >
                  <Users className="w-4 h-4" />
                  {t("facebook_group")}
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="border-t border-slate-800/60 pt-8 text-center text-base text-slate-500">
          <p>© {new Date().getFullYear()} {t("app_name")} · {t("location_full")}</p>
        </motion.div>
      </motion.div>
    </footer>
  );
}
