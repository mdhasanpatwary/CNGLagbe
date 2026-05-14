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
      "mb-8 relative flex flex-col gap-1",
      centered ? "items-center text-center" : "items-start",
      className
    )}>
      {/* Visual Accent */}
      <div className={cn("flex items-center gap-3", centered && "justify-center")}>
        <div className="w-1 h-7 bg-primary rounded-full" />
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 uppercase">
          {title}
        </h1>
      </div>

      {/* Subtitle / Context */}
      {subtitle && (
        <p className={cn(
          "text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400",
          centered ? "text-center" : "pl-[16px]"
        )}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
