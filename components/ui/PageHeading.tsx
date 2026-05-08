import React from "react";
import { cn } from "@/lib/utils";

interface PageHeadingProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

/**
 * A premium, highly stylized page heading component.
 * Features:
 * - Dynamic primary color bar with glow
 * - High-contrast black typography
 * - Subtle glassmorphism and animations
 * - Responsive alignment
 */
export function PageHeading({ title, subtitle, centered = false, className }: PageHeadingProps) {
  return (
    <div className={cn(
      "mb-10 relative flex flex-col gap-1.5 group",
      centered ? "items-center text-center" : "items-start",
      className
    )}>
      {/* Visual Accent */}
      <div className={cn("flex items-center gap-3", centered && "justify-center")}>
        <div className="relative">
          <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] transition-all duration-500 group-hover:h-10 group-hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.7)]" />
          {/* Subtle pulse orb */}
          <div className="absolute top-0 -left-1 w-3.5 h-3.5 bg-primary/20 rounded-full blur-md animate-pulse" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase drop-shadow-sm transition-transform duration-300 group-hover:translate-x-1">
          {title}
        </h1>
      </div>

      {/* Subtitle / Context */}
      {subtitle && (
        <div className={cn(
          "flex items-center gap-2",
          centered ? "justify-center" : "pl-[18px]"
        )}>
          {!centered && <div className="w-1 h-1 rounded-full bg-slate-300" />}
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400/80">
            {subtitle}
          </p>
        </div>
      )}

      {/* Modern Gradient underline */}
      <div className={cn(
        "absolute -bottom-4 w-12 h-1 bg-gradient-to-r from-primary to-transparent rounded-full opacity-30 group-hover:w-24 transition-all duration-700",
        centered ? "left-1/2 -translate-x-1/2" : "left-0"
      )} />
    </div>
  );
}
