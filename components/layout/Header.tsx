"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogOut, User, ChevronLeft, RefreshCcw, Navigation, Settings, UserCircle, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppButton } from "@/components/ui/AppButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";

import { User as UserType } from "@/lib/types/user";

interface HeaderProps {
  role?: "landing" | "user" | "driver" | "admin";
  variant?: "sticky" | "floating" | "fixed";
  theme?: "primary" | "light" | "dark" | "transparent";
  user?: UserType | null;

  onLogout?: () => void;
  onRefresh?: () => void;
  onRecenter?: () => void;
  isRefreshing?: boolean;
  rightContent?: React.ReactNode;
  className?: string;
}

export function Header({
  role = "landing",
  variant = "sticky",
  theme,
  user,

  onLogout,
  onRefresh,
  onRecenter,
  isRefreshing,
  rightContent,
  className,
}: HeaderProps) {
  const { t } = useLang();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDriver = role === "driver";
  const isAdmin = role === "admin";
  const isFloating = variant === "floating";
  const isFixed = variant === "fixed";

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine effective theme
  const effectiveTheme = theme || (isAdmin ? "dark" : isDriver ? "light" : "primary");

  const themes = {
    primary: "bg-primary text-primary-foreground shadow-md",
    light: "bg-white border-b border-slate-200 text-slate-800 shadow-sm",
    dark: "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl",
    transparent: "bg-transparent text-white border-none shadow-none",
  };

  const variantStyles = isFloating
    ? "fixed top-2 md:top-4 left-2 md:left-4 right-2 md:right-4 z-50 rounded-xl md:rounded-2xl bg-white border border-slate-200 shadow-xl"
    : isFixed
      ? "fixed top-0 left-0 right-0 z-50 w-full"
      : "sticky top-0 z-20 w-full";

  // Toggle logo based on theme for contrast
  const logoSrc = (effectiveTheme === "light" && !isFloating) ? "/logo.png" : "/logo_white.png";

  return (
    <header className={cn(
      variantStyles,
      !isFloating && themes[effectiveTheme],
      "px-3 md:px-6 py-2 flex justify-between items-center transition-all duration-500",
      effectiveTheme === "light" && !isFloating && "py-2.5",
      isDriver && !isFloating && "pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 min-h-[3.5rem]",
      className
    )}>
      <div className="flex items-center gap-3">


        <div className="flex items-center gap-3">
          <Link href={isDriver ? "/driver" : isAdmin ? "/admin" : user ? "/user" : "/"} className="flex items-center gap-2 group">
            <div className="flex items-center group-hover:opacity-80 transition-opacity h-9 md:h-11">
              <Image
                src={logoSrc}
                alt="CNGLagbe Logo"
                width={140}
                height={36}
                className="h-full w-auto object-contain transition-all duration-300 scale-90 md:scale-100 origin-left"
                style={{ width: "auto" }}
                priority
              />
            </div>
          </Link>




        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">
        {onRefresh && (
          <AppButton
            variant="ghost"
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              "rounded-xl h-10 md:h-11 px-2 md:px-3 gap-2 font-bold text-sm md:text-base",
              isAdmin ? "bg-white/5 text-white hover:bg-white/10 border border-white/10" : "text-slate-600"
            )}
          >
            <RefreshCcw size={16} className={isRefreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{t("refresh_status")}</span>
          </AppButton>
        )}

        {onRecenter && (
          <AppButton
            variant="ghost"
            onClick={onRecenter}
            className={cn(
              "h-10 md:h-11 px-2 md:px-3 gap-2 font-bold text-sm md:text-base",
              effectiveTheme === "primary" || effectiveTheme === "dark" ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Navigation size={18} />
            <span className="hidden sm:inline">{t("recenter")}</span>
          </AppButton>
        )}

        {rightContent}

        <LanguageSwitcher />

        {user ? (
          <div className="flex items-center gap-2 ml-1 relative" ref={menuRef}>
            <AppButton
              variant="ghost"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={cn(
                "group flex h-auto items-center gap-1.5 md:gap-2 px-1.5 md:px-2 py-1 md:py-1.5 rounded-full transition-all active:scale-95 outline-none border-none hover:bg-transparent",
                effectiveTheme === "primary" || effectiveTheme === "dark" ? "bg-white/10 hover:bg-white/20 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700",
                isMenuOpen && (effectiveTheme === "primary" || effectiveTheme === "dark" ? "bg-white/30" : "bg-slate-200")
              )}
            >
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-full overflow-hidden bg-white/20 flex items-center justify-center border border-white/10 ring-2 ring-white/5">
                {user.photoUrl
                  ? <Image src={user.photoUrl} alt={user.name} width={44} height={44} className="w-full h-full object-cover object-top transition-all duration-500" />
                  : <User size={18} className="text-slate-400" />}
              </div>
              <ChevronLeft size={12} className={cn(
                "transition-transform duration-300 opacity-40",
                isMenuOpen ? "rotate-90" : "-rotate-90"
              )} />
            </AppButton>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={cn(
                    "absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden shadow-2xl z-50 border",
                    effectiveTheme === "primary" || effectiveTheme === "dark"
                      ? "bg-slate-900/90 backdrop-blur-xl border-white/10 text-white"
                      : "bg-white/95 backdrop-blur-xl border-slate-200 text-slate-800"
                  )}
                >
                  {/* User Info Header */}
                  <div className={cn(
                    "px-4 py-4 border-b",
                    effectiveTheme === "primary" || effectiveTheme === "dark" ? "border-white/5 bg-white/5" : "border-slate-100 bg-slate-50/50"
                  )}>
                    <p className="text-sm font-black tracking-tight leading-tight truncate">{user.name}</p>
                    <p className={cn(
                      "text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60",
                      effectiveTheme === "primary" || effectiveTheme === "dark" ? "text-white/60" : "text-slate-500"
                    )}>
                      {t("id")}: {user.id.slice(-6).toUpperCase()}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="p-1.5">
                    {!isDriver && !isAdmin && (
                      <Link
                        href="/user"
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-colors group text-primary min-h-[44px]",
                          effectiveTheme === "primary" || effectiveTheme === "dark" ? "hover:bg-white/10" : "hover:bg-primary/5"
                        )}
                      >
                        <User size={18} className="opacity-100" />
                        <span>{t("dashboard")}</span>
                      </Link>
                    )}

                    <Link
                      href={isDriver ? "/driver/profile" : "/profile"}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-colors group min-h-[44px]",
                        effectiveTheme === "primary" || effectiveTheme === "dark" ? "hover:bg-white/10" : "hover:bg-slate-100"
                      )}
                    >
                      <UserCircle size={18} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                      <span>{t("profile")}</span>
                    </Link>

                    {!isDriver && !isAdmin && (
                      <Link
                        href="/user/history"
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-colors group min-h-[44px]",
                          effectiveTheme === "primary" || effectiveTheme === "dark" ? "hover:bg-white/10" : "hover:bg-slate-100"
                        )}
                      >
                        <History size={18} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                        <span>{t("booking_history")}</span>
                      </Link>
                    )}

                    <Link
                      href={isDriver ? "/driver/profile" : "/profile"} // Fallback to profile for now as settings is usually inside
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-colors group min-h-[44px]",
                        effectiveTheme === "primary" || effectiveTheme === "dark" ? "hover:bg-white/10" : "hover:bg-slate-100"
                      )}
                    >
                      <Settings size={18} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                      <span>{t("settings")}</span>
                    </Link>

                    <div className={cn(
                      "my-1.5 h-px",
                      effectiveTheme === "primary" || effectiveTheme === "dark" ? "bg-white/5" : "bg-slate-100"
                    )} />

                    <AppButton
                      variant="ghost"
                      onClick={async () => {
                        setIsMenuOpen(false);
                        if (onLogout) {
                          onLogout();
                        } else {
                          try {
                            await fetch("/api/auth/logout", { method: "POST" });
                            window.location.href = "/";
                          } catch (e) {
                            console.error("Logout failed", e);
                          }
                        }
                      }}
                      className={cn(
                        "flex w-full h-auto items-center justify-start gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-colors text-red-500 hover:text-red-600 border-none min-h-[44px]",
                        effectiveTheme === "primary" || effectiveTheme === "dark" ? "hover:bg-red-500/10" : "hover:bg-red-50"
                      )}
                    >
                      <LogOut size={18} />
                      <span>{t("logout")}</span>
                    </AppButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : role === "landing" && (
          <Link href="/login">
            <AppButton
              variant="outline"
              className={cn(
                "rounded-full font-black text-[10px] md:text-[11px] uppercase h-10 md:h-11 px-4 md:px-6 transition-all duration-300 tracking-wider",
                effectiveTheme === "primary" || effectiveTheme === "dark"
                  ? "border-white/40 text-white hover:bg-white hover:text-primary hover:border-white shadow-lg shadow-black/10"
                  : "border-primary/30 text-primary hover:bg-primary hover:text-white shadow-sm"
              )}
            >
              {t("user_login")}
            </AppButton>
          </Link>
        )}
      </div>
    </header>
  );
}
