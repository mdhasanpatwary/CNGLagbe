"use client";

import React, { useEffect, useState } from "react";
import { X, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/hooks/useLang";
import { AppButton } from "@/components/ui/AppButton";
import { TextKey } from "@/constants/text";

interface ContributionBannerProps {
  onAddClick: () => void;
}

export function ContributionBanner({ onAddClick }: ContributionBannerProps) {
  const { t } = useLang();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed previously
    const dismissedUntil = localStorage.getItem("hide_contribution_banner_until");
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
      return;
    }

    // Defer state update to avoid synchronous setState during effect execution
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Dismiss for 30 days
    const duration = 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem("hide_contribution_banner_until", (Date.now() + duration).toString());
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full relative overflow-hidden bg-gradient-to-r from-emerald-50 via-teal-50/30 to-emerald-50/50 border border-emerald-100 rounded-3xl p-5 sm:p-6 mb-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          {/* Decorative subtle background shapes */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start gap-4 z-10">
            {/* Community Icon with low-literacy helper text */}
            <div className="hidden sm:flex flex-col items-center gap-1 shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-1.5 max-w-xl pr-10 md:pr-0">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight font-bn leading-snug">
                {t("contribution_banner_title" as TextKey)}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed font-bn">
                {t("contribution_banner_desc" as TextKey)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto shrink-0 z-10 justify-end">
            <AppButton
              onClick={onAddClick}
              className="w-full sm:w-auto h-11 px-5 rounded-xl bg-primary hover:bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-600/20 transition-all text-sm shrink-0"
            >
              {t("contribution_banner_cta" as TextKey)}
            </AppButton>

            {/* Dismiss Cross Button using AppButton to follow design guidelines */}
            <AppButton
              variant="ghost"
              onClick={handleDismiss}
              aria-label="Remove banner"
              className="absolute top-4 right-4 md:static p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer h-auto min-h-0 min-w-0"
            >
              <X className="w-5 h-5" />
            </AppButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
