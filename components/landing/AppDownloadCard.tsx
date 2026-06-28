"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Download, QrCode } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { Tilt } from "@/components/ui/Tilt";
import { cn } from "@/lib/utils";

export interface AppDownloadCardProps {
  title: string;
  type: "user" | "driver";
  comingSoon?: boolean;
}

/**
 * App download card component with coming soon badge and QR code
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
        className="backdrop-blur-md border border-white/10 rounded-[2.5rem] p-6 sm:p-8 flex flex-col items-center text-center gap-6 group shadow-2xl relative overflow-hidden cursor-pointer h-full"
      >
        {comingSoon && (
          <div className="absolute top-7 right-[-45px] w-[170px] bg-amber-400 text-slate-900 text-xs font-bold py-1 rotate-45 shadow-sm uppercase tracking-wider z-20 text-center">
            {t("coming_soon")}
          </div>
        )}

        <div className={cn(
          "w-20 h-20 rounded-3xl overflow-hidden flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 border-2",
          type === "user"
            ? "border-primary/20 bg-gradient-to-br from-primary to-emerald-600"
            : "border-slate-700 bg-gradient-to-br from-slate-700 to-slate-900"
        )}>
          <div className="relative w-full h-full">
            <Image
              src={type === "user" ? "/user_app_icon.png" : "/driver_app_icon.png"}
              alt={title}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-white mb-2 font-bn tracking-tight">{title}</h3>
          <p className="text-white/60 text-sm font-bn font-normal leading-relaxed">
            {type === "user" ? t("for_daily_bookings") : t("for_partners")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-auto items-center">
          {/* QR Code Section */}
          <div className="relative group/qr flex flex-col items-center gap-2">
            <div className="relative w-28 h-28 p-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden group-hover/qr:border-primary/50 transition-colors duration-300">
              <Image 
                src="/app_qr.png" 
                alt="App Download QR Code" 
                fill 
                sizes="112px"
                className="object-cover opacity-80 group-hover/qr:opacity-100 transition-opacity duration-300"
              />
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/qr:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center gap-1.5 opacity-40 group-hover/qr:opacity-100 transition-opacity">
              <QrCode className="w-3 h-3 text-white" />
              <span className="text-[9px] font-black text-white uppercase tracking-widest">{t("scan_to_download")}</span>
            </div>
          </div>

          {/* Buttons Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 opacity-50 cursor-not-allowed hover:bg-white/10 transition-colors min-h-10">
              <Download className="w-3.5 h-3.5 text-white/40" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{t("google_play")}</span>
            </div>
            <div className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 opacity-50 cursor-not-allowed hover:bg-white/10 transition-colors min-h-10">
              <Download className="w-3.5 h-3.5 text-white/40" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{t("app_store")}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Tilt>
  );
}
