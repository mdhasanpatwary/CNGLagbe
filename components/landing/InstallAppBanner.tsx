"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { X, Share, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/hooks/useLang";
import { AppButton } from "@/components/ui/AppButton";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallAppBanner() {
  const { t } = useLang();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showiOSModal, setShowiOSModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Check if running in standalone mode (already installed)
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      ("standalone" in window.navigator && 
        (window.navigator as unknown as { standalone: boolean }).standalone === true);

    const trackInstallation = async () => {
      try {
        const isTracked = localStorage.getItem("pwa_install_tracked");
        if (isTracked) return;

        let deviceId = localStorage.getItem("pwa_device_id");
        if (!deviceId) {
          deviceId = typeof crypto.randomUUID === "function" 
            ? crypto.randomUUID() 
            : Math.random().toString(36).substring(2) + Date.now().toString(36);
          localStorage.setItem("pwa_device_id", deviceId);
        }

        const host = window.location.hostname;
        const role = host.startsWith("driver.") ? "driver" : "user";

        const res = await fetch("/api/pwa-install", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceId,
            userAgent: navigator.userAgent,
            role,
          }),
        });

        if (res.ok) {
          localStorage.setItem("pwa_install_tracked", "true");
        }
      } catch (err) {
        console.error("Failed to track PWA install:", err);
      }
    };

    if (isStandalone) {
      trackInstallation();
      return;
    }

    // 2. Check localStorage dismiss duration
    const dismissedUntil = localStorage.getItem("pwa_install_banner_dismissed_until");
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
      return;
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent;
    const iosDevice = /iPad|iPhone|iPod/.test(userAgent) && !("MSStream" in window);
    
    // Defer state updates to avoid synchronous setState during effect execution
    const timer = setTimeout(() => {
      setIsIOS(iosDevice);
      if (iosDevice) {
        setShowBanner(true);
      }
    }, 0);

    if (!iosDevice) {
      // Android/Chrome/Chromium path
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowBanner(true);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }

    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const handleAppInstalled = () => {
      setShowBanner(false);
      setDeferredPrompt(null);

      // Track newly installed app
      const trackInstallation = async () => {
        try {
          let deviceId = localStorage.getItem("pwa_device_id");
          if (!deviceId) {
            deviceId = typeof crypto.randomUUID === "function" 
              ? crypto.randomUUID() 
              : Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem("pwa_device_id", deviceId);
          }

          const host = window.location.hostname;
          const role = host.startsWith("driver.") ? "driver" : "user";

          const res = await fetch("/api/pwa-install", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              deviceId,
              userAgent: navigator.userAgent,
              role,
            }),
          });

          if (res.ok) {
            localStorage.setItem("pwa_install_tracked", "true");
          }
        } catch (err) {
          console.error("Failed to track PWA install on event:", err);
        }
      };

      trackInstallation();
    };

    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowiOSModal(true);
      return;
    }

    if (!deferredPrompt) return;

    // Trigger native prompt
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismissClick = () => {
    setShowBanner(false);
    // Dismiss for 7 days (7 * 24 * 60 * 60 * 1000)
    const dismissDuration = 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem("pwa_install_banner_dismissed_until", (Date.now() + dismissDuration).toString());
  };

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="fixed bottom-4 left-4 right-4 md:hidden z-50 p-4 rounded-2xl backdrop-blur-md bg-white/95 border border-slate-100/80 shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 border border-slate-100">
                <Image
                  src="/logo.png"
                  alt="CNGLagbe Logo"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-sm font-bold text-slate-800 truncate font-bn">
                  {t("pwa_install_title")}
                </span>
                <span className="text-[11px] text-slate-500 truncate font-bn mt-0.5">
                  {t("pwa_install_subtitle")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AppButton
                onClick={handleInstallClick}
                className="h-9 px-4 text-xs font-bold rounded-lg bg-primary text-white hover:bg-success transition-all font-bn border-0"
              >
                {t("pwa_install_btn")}
              </AppButton>
              <AppButton
                variant="ghost"
                size="sm"
                onClick={handleDismissClick}
                className="w-8 h-8 !p-0 !min-w-0 !h-8 !px-0 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 active:scale-95 transition-all shrink-0"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </AppButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Instructions Modal */}
      <AnimatePresence>
        {showiOSModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowiOSModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl overflow-hidden z-10 border border-slate-100"
            >
              {/* App logo/icon in modal */}
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-slate-50 overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="CNGLagbe Logo"
                    width={56}
                    height={56}
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-lg font-black text-slate-800 font-bn tracking-tight mb-2">
                  {t("pwa_ios_title")}
                </h3>
                <p className="text-xs text-slate-500 font-bn leading-relaxed">
                  {t("pwa_ios_desc")}
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary shrink-0 border border-slate-100">
                    <Share className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium font-bn text-left">
                    {t("pwa_ios_step1")}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary shrink-0 border border-slate-100">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium font-bn text-left">
                    {t("pwa_ios_step2")}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary shrink-0 border border-slate-100 font-bold text-sm">
                    Add
                  </div>
                  <span className="text-xs font-medium font-bn text-left">
                    {t("pwa_ios_step3")}
                  </span>
                </div>
              </div>

              <AppButton
                onClick={() => setShowiOSModal(false)}
                className="w-full h-12 rounded-xl bg-primary text-white font-bold shadow-lg hover:bg-success transition-all font-bn border-0"
              >
                {t("pwa_ios_close")}
              </AppButton>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
