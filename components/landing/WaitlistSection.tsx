"use client";

import React from "react";
import { Users, User as UserIcon, Shield, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useWaitlist } from "@/hooks/useWaitlist";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";
import { AppButton } from "@/components/ui/AppButton";

export function WaitlistSection() {
  const { t } = useLang();
  const {
    waitlistCount,
    isSubmitting,
    hasJoined,
    register,
    handleSubmit,
    setValue,
    selectedRole,
    errors
  } = useWaitlist();

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
  };

  const formattedCountText = (count: number) => {
    return t("waitlist_count").replace("{count}", count.toString());
  };

  return (
    <section className="relative w-full py-16 sm:py-24 overflow-hidden bg-slate-900 border-y border-white/5">
      {/* Visual background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgb(22,163,74,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgb(15,23,42,0.8),transparent_70%)]" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={cardVariants}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-slate-950/60 backdrop-blur-[30px] border border-white/10 rounded-[32px] p-6 sm:p-12 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
                <Users className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-xs font-black text-primary uppercase tracking-[0.25em] font-sans">
                  {t("coming_soon")}
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 font-bn tracking-tight">
                {t("waitlist_title")}
              </h2>
              <p className="text-white/60 text-base font-bn leading-relaxed max-w-xl mx-auto">
                {t("waitlist_subtitle")}
              </p>

              {waitlistCount !== null && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-6 inline-block bg-white/5 border border-white/10 rounded-2xl px-6 py-2.5"
                >
                  <p className="text-primary font-bold text-sm sm:text-base font-bn tracking-wide">
                    {formattedCountText(waitlistCount)}
                  </p>
                </motion.div>
              )}
            </div>

            {hasJoined ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center text-white"
              >
                <CheckCircle className="w-16 h-16 text-primary mb-4" />
                <h3 className="text-2xl font-bold font-bn mb-2">{t("waitlist_success")}</h3>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name Input */}
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 font-bn pl-1">
                      {t("waitlist_name_label")}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahim Khan"
                      {...register("name")}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-base font-bn focus:outline-none focus:border-primary/50 transition-colors"
                    />
                    {errors.name && (
                      <span className="text-xs text-red-500 font-bold mt-1.5 pl-1">{errors.name.message}</span>
                    )}
                  </div>

                  {/* Phone Input */}
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 font-bn pl-1">
                      {t("waitlist_phone_label")}
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 01712345678"
                      {...register("phone")}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-base font-bn focus:outline-none focus:border-primary/50 transition-colors"
                    />
                    {errors.phone && (
                      <span className="text-xs text-red-500 font-bold mt-1.5 pl-1">{errors.phone.message}</span>
                    )}
                  </div>
                </div>

                {/* Role Selector */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3 font-bn pl-1">
                    {t("waitlist_role_label")}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <AppButton
                      type="button"
                      variant="ghost"
                      onClick={() => setValue("role", "USER")}
                      className={cn(
                        "h-auto flex items-center justify-center gap-2.5 rounded-xl py-3.5 px-4 font-bn font-bold text-base transition-all duration-300 border focus:ring-0 focus:ring-offset-0 active:scale-[0.99]",
                        selectedRole === "USER"
                          ? "bg-primary border-primary text-white hover:bg-primary/95 shadow-[0_10px_30px_rgba(22,163,74,0.3)]"
                          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <UserIcon className="w-5 h-5" />
                      <span>{t("waitlist_role_passenger")}</span>
                    </AppButton>
                    <AppButton
                      type="button"
                      variant="ghost"
                      onClick={() => setValue("role", "DRIVER")}
                      className={cn(
                        "h-auto flex items-center justify-center gap-2.5 rounded-xl py-3.5 px-4 font-bn font-bold text-base transition-all duration-300 border focus:ring-0 focus:ring-offset-0 active:scale-[0.99]",
                        selectedRole === "DRIVER"
                          ? "bg-primary border-primary text-white hover:bg-primary/95 shadow-[0_10px_30px_rgba(22,163,74,0.3)]"
                          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <Shield className="w-5 h-5" />
                      <span>{t("waitlist_role_driver")}</span>
                    </AppButton>
                  </div>
                </div>

                {/* Submit Button */}
                <AppButton
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-success text-white font-black text-lg py-4 h-auto rounded-xl shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 font-bn"
                >
                  {isSubmitting ? "..." : t("waitlist_submit")}
                </AppButton>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
