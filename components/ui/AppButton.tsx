"use client";
// Use AppButton only (design system rule)

import React from "react";
import { Loader2 } from "lucide-react";
import { type TextKey } from "@/constants/text";
import { cn } from "@/lib/utils";
import { useLang } from "@/hooks/useLang";

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  fullWidth?: boolean;
  loading?: boolean;
  loadingTextKey?: TextKey;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function AppButton({
  className,
  variant = "primary",
  fullWidth = false,
  loading = false,
  loadingTextKey = "finding",
  leftIcon,
  rightIcon,
  children,
  disabled,
  type = "button",
  ...props
}: AppButtonProps) {
  const { t } = useLang();

  const baseStyles = "h-12 px-4 rounded-lg font-medium text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90 focus:ring-primary",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-300",
    ghost: "bg-transparent text-primary hover:bg-primary/10 focus:ring-primary/30",
    outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary/5 focus:ring-primary/30",
  };

  return (
    // eslint-disable-next-line no-restricted-syntax
    <button
      type={type}
      className={cn(
        baseStyles,
        variants[variant],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{t(loadingTextKey)}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
