"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogOut, User, ChevronLeft, RefreshCcw, Navigation, Settings, UserCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppButton } from "@/components/ui/AppButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";

import { User as UserType } from "@/lib/types/user";

interface HeaderProps {
  role?: "landing" | "user" | "driver" | "admin";
  variant?: "sticky" | "floating";
  theme?: "primary" | "light" | "dark" | "transparent";
  title?: string;
  subtitle?: string;
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
  title,
  subtitle,
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
    light: "bg-white/70 backdrop-blur-xl border-b border-slate-200/50 text-slate-800 shadow-sm",
    dark: "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl backdrop-blur-lg bg-opacity-90",
    transparent: "bg-transparent text-slate-800",
  };

  const floatingStyles = isFloating
    ? "fixed top-4 left-4 right-4 z-50 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/50 shadow-xl"
    : "sticky top-0 z-20 w-full";

  const textStyles = {
    primary: "text-white",
    light: "text-slate-800",
    dark: "text-white",
    transparent: "text-slate-800",
  };

  const subTextStyles = {
    primary: "text-white/60",
    light: "text-slate-400",
    dark: "text-slate-400",
    transparent: "text-slate-400",
  };

  return (
    <header className={cn(
      floatingStyles,
      !isFloating && themes[effectiveTheme],
      "px-4 py-2 flex justify-between items-center transition-all duration-300",
      effectiveTheme === "light" && !isFloating && "py-2.5",
      isDriver && !isFloating && "pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 min-h-[3.5rem]",
      className
    )}>
      <div className="flex items-center gap-3">


        <div className="flex items-center gap-3">
          <Link href={isDriver ? "/driver/dashboard" : isAdmin ? "/admin" : "/"} className="flex items-center gap-2 group">
            <div className={cn("flex items-center group-hover:opacity-80 transition-opacity", title ? "h-7" : "h-9")}>
              <Image
                src="/logo.png"
                alt="CNGLagbe Logo"
                width={140}
                height={36}
                className="h-full w-auto object-contain transition-all duration-300"
                priority
              />
            </div>
          </Link>

          {title && (
            <div className="flex flex-col pl-3 border-l-2 border-slate-200/50">
              <h1 className={cn(
                "text-sm font-black tracking-tight uppercase",
                isFloating ? "text-slate-800" : textStyles[effectiveTheme]
              )}>
                {title}
              </h1>
              {subtitle && (
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-widest mt-0.5 opacity-60",
                  isFloating ? "text-slate-400" : subTextStyles[effectiveTheme]
                )}>
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {!title && isAdmin && (
            <div className="flex flex-col pl-3 border-l-2 border-slate-200/50">
              <h1 className={cn(
                "text-sm font-black tracking-tight uppercase text-primary hidden sm:block",
                isFloating ? "text-slate-800" : textStyles[effectiveTheme]
              )}>
                {t("admin_dashboard")}
              </h1>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onRefresh && (
          <AppButton
            variant="ghost"
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              "rounded-xl h-9 px-3 gap-2 font-bold text-base",
              isAdmin ? "bg-white/5 text-white hover:bg-white/10 border border-white/10" : "text-slate-600"
            )}
          >
            <RefreshCcw size={16} className={isRefreshing ? "animate-spin" : ""} />
            <span className="hidden xs:inline">{t("refresh_status")}</span>
          </AppButton>
        )}

        {onRecenter && (
          <AppButton
            variant="ghost"
            onClick={onRecenter}
            className={cn(
              "h-9 px-3 gap-2 font-bold text-base",
              effectiveTheme === "primary" || effectiveTheme === "dark" ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Navigation size={18} />
            <span className="hidden xs:inline">{t("recenter")}</span>
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
                "flex h-auto items-center gap-2 px-2 py-1.5 rounded-full transition-all active:scale-95 outline-none border-none hover:bg-transparent",
                effectiveTheme === "primary" || effectiveTheme === "dark" ? "bg-white/10 hover:bg-white/20 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700",
                isMenuOpen && (effectiveTheme === "primary" || effectiveTheme === "dark" ? "bg-white/30" : "bg-slate-200")
              )}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 flex items-center justify-center border border-white/10 ring-2 ring-white/5">
                {user.photoUrl
                  ? <Image src={user.photoUrl} alt={user.name} width={32} height={32} className="w-full h-full object-cover" />
                  : <User size={16} className={isFloating ? "text-slate-400" : (effectiveTheme === "light" ? "text-slate-400" : "text-white/70")} />}
              </div>
              <ChevronLeft size={14} className={cn(
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
                    <Link
                      href={isDriver ? "/driver/profile" : "/profile"}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors group",
                        effectiveTheme === "primary" || effectiveTheme === "dark" ? "hover:bg-white/10" : "hover:bg-slate-100"
                      )}
                    >
                      <UserCircle size={18} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                      <span>{t("profile")}</span>
                    </Link>

                    <Link
                      href={isDriver ? "/driver/profile" : "/profile"} // Fallback to profile for now as settings is usually inside
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors group",
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
                      onClick={() => {
                        setIsMenuOpen(false);
                        onLogout?.();
                      }}
                      className={cn(
                        "flex w-full h-auto items-center justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors text-red-500 hover:text-red-600 border-none",
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
          <div className="flex gap-2 ml-1">
            <Link href="/login">
              <AppButton
                variant="ghost"
                className={cn(
                  "rounded-full font-bold text-base uppercase h-9 px-3 transition-colors",
                  effectiveTheme === "primary" || effectiveTheme === "dark" ? "text-white hover:bg-white/10" : "text-slate-800 hover:bg-slate-100"
                )}
              >
                {t("user_login")}
              </AppButton>
            </Link>
            <Link href="/driver/login">
              <AppButton variant="secondary" className="rounded-full font-bold text-base uppercase h-9 px-3 shadow-sm">
                {t("driver_login")}
              </AppButton>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
