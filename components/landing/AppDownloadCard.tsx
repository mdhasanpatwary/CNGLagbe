"use client";

import React from "react";
import { motion } from "framer-motion";
import { Smartphone, Download } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { Tilt } from "@/components/ui/Tilt";
import { cn } from "@/lib/utils";

export interface AppDownloadCardProps {
  title: string;
  type: "user" | "driver";
  comingSoon?: boolean;
}

/**
 * App download card component with coming soon badge
 * 
 * @param title - App title
 * @param type - App type (user or driver)
 * @param comingSoon - Show coming soon badge
 */
export function AppDownloadCard({ title, type, comingSoon }: AppDownloadCardProps) {
  const { t } = useLang();

  return (
    <Tilt className="h-full">
      <motion.div
        whileHover={{ y: -10, backgroundColor: "rgba(255, 255, 255, 0.12)" }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
        className="backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center text-center gap-6 group shadow-2xl relative overflow-hidden cursor-pointer h-full"
      >
        {comingSoon && (
          <div className="absolute top-7 right-[-45px] w-[170px] bg-amber-400 text-slate-900 text-xs font-bold py-1 rotate-45 shadow-sm uppercase tracking-wider z-20 text-center">
            {t("coming_soon")}
          </div>
        )}

        <div className={cn(
          "w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
          type === "user"
            ? "bg-gradient-to-br from-primary to-emerald-600 text-white"
            : "bg-gradient-to-br from-slate-700 to-slate-900 text-white"
        )}>
          <Smartphone className="w-10 h-10" />
        </div>

        <div>
          <h3 className="text-base font-bold text-white mb-2 font-bn tracking-tight">{title}</h3>
          <p className="text-white/60 text-sm font-bn font-normal leading-relaxed">
            {type === "user" ? t("for_daily_bookings") : t("for_partners")}
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full mt-auto">
          <div className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-2xl py-3 px-4 opacity-50 cursor-not-allowed group-hover:bg-white/10 transition-colors min-h-11">
            <Download className="w-4 h-4 text-white/40" />
            <span className="text-sm font-bold text-white/40 uppercase tracking-widest">{t("google_play")}</span>
          </div>
          <div className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-2xl py-3 px-4 opacity-50 cursor-not-allowed group-hover:bg-white/10 transition-colors min-h-11">
            <Download className="w-4 h-4 text-white/40" />
            <span className="text-sm font-bold text-white/40 uppercase tracking-widest">{t("app_store")}</span>
          </div>
        </div>
      </motion.div>
    </Tilt>
  );
}
