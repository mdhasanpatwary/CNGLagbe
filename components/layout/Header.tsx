"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { LogOut, User, ChevronLeft, RefreshCcw, Users, Navigation } from "lucide-react";
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
  showBack?: boolean;
  onBack?: () => void;
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
  showBack,
  onBack,
  onLogout,
  onRefresh,
  onRecenter,
  isRefreshing,
  rightContent,
  className,
}: HeaderProps) {
  const { t } = useLang();

  const isDriver = role === "driver";
  const isAdmin = role === "admin";
  const isFloating = variant === "floating";

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
      "px-4 py-3 flex justify-between items-center transition-all duration-300",
      effectiveTheme === "light" && !isFloating && "py-4",
      isDriver && !isFloating && "pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-4 min-h-[4.5rem]",
      className
    )}>
      <div className="flex items-center gap-3">
        {showBack && (
          <AppButton
            variant="ghost"
            onClick={onBack}
            className={cn(
              "rounded-full h-9 w-9 p-0",
              effectiveTheme === "primary" || effectiveTheme === "dark" ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <ChevronLeft size={20} />
          </AppButton>
        )}

        <div className="flex items-center gap-3">
          {!title && (
            <Link href={isDriver ? "/driver/dashboard" : isAdmin ? "/admin" : "/"} className="flex items-center gap-2 group">
              {isAdmin ? (
                <div className="bg-primary/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="text-primary" size={20} />
                </div>
              ) : isDriver ? (
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-all overflow-hidden border border-white/10">
                  {user?.photoUrl ? (
                    <Image src={user.photoUrl} alt="Profile" width={32} height={32} className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-white w-4 h-4" />
                  )}
                </div>
              ) : null}
            </Link>
          )}
          
          <div className="flex flex-col">
            <h1 className={cn(
              "text-base font-black tracking-tight uppercase",
              isFloating ? "text-slate-800" : textStyles[effectiveTheme]
            )}>
              {title || t("app_name")}
              {isAdmin && !title && (
                <span className="text-primary font-medium text-sm ml-1 opacity-80 hidden sm:inline">
                  {t("admin_dashboard")}
                </span>
              )}
            </h1>
            {(subtitle || (isDriver && !title)) && (
              <p className={cn(
                "text-[8px] font-bold uppercase tracking-widest mt-0.5 opacity-80",
                isFloating ? "text-slate-400" : subTextStyles[effectiveTheme]
              )}>
                {subtitle || (isDriver ? `${user?.name?.split(" ")[0]} • ID: ${user?.id?.slice(-4).toUpperCase()}` : "")}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onRefresh && (
          <AppButton
            variant="ghost"
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              "rounded-xl h-9 px-3 gap-2 font-bold text-xs",
              isAdmin ? "bg-white/5 text-white hover:bg-white/10 border border-white/10" : "text-slate-600"
            )}
          >
            <RefreshCcw size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span className="hidden xs:inline">{t("refresh_status")}</span>
          </AppButton>
        )}

        {onRecenter && (
          <AppButton
            variant="ghost"
            onClick={onRecenter}
            className={cn(
              "rounded-full h-9 w-9 p-0",
              effectiveTheme === "primary" || effectiveTheme === "dark" ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Navigation size={18} />
          </AppButton>
        )}

        {rightContent}

        <LanguageSwitcher />

        {user ? (
          <div className="flex items-center gap-2 ml-1">
            <Link 
              href={isDriver ? "/driver/profile" : "/profile"} 
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-full transition-colors",
                effectiveTheme === "primary" || effectiveTheme === "dark" ? "bg-white/10 hover:bg-white/20 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              )}
            >
              {!isDriver && (
                <div className="w-7 h-7 rounded-full overflow-hidden bg-white/20 flex items-center justify-center border border-white/10">
                  {user.photoUrl
                    ? <Image src={user.photoUrl} alt={user.name} width={28} height={28} className="w-full h-full object-cover" />
                    : <User size={14} className={isFloating ? "text-slate-400" : (effectiveTheme === "light" ? "text-slate-400" : "text-white/70")} />}
                </div>
              )}
              <span className="text-[10px] font-black uppercase tracking-widest pr-1 hidden xs:inline">
                {user.name.split(" ")[0]}
              </span>
            </Link>
            {onLogout && (
              <AppButton 
                variant="ghost" 
                onClick={onLogout} 
                className={cn(
                  "rounded-full h-9 w-9 p-0",
                  effectiveTheme === "primary" || effectiveTheme === "dark" ? "text-white hover:bg-white/10" : "text-slate-400 hover:bg-red-50 hover:text-red-600"
                )}
              >
                <LogOut size={16} />
              </AppButton>
            )}
          </div>
        ) : role === "landing" && (
          <div className="flex gap-1.5 ml-1">
            <Link href="/login">
              <AppButton variant="ghost" className="rounded-full text-white hover:bg-white/10 font-bold text-[10px] uppercase h-8 px-2.5">
                {t("user_login")}
              </AppButton>
            </Link>
            <Link href="/driver/login">
              <AppButton variant="secondary" className="rounded-full font-bold text-[10px] uppercase h-8 px-2.5 shadow-sm">
                {t("driver_login")}
              </AppButton>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
