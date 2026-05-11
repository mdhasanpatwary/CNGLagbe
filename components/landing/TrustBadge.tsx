"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface TrustBadgeProps {
  icon: React.ReactNode;
  label: string;
  variant?: "default" | "glass";
}

/**
 * Trust badge component for displaying trust indicators
 * 
 * @param icon - Icon element to display
 * @param label - Badge label text
 * @param variant - Visual style variant (default or glass)
 */
export function TrustBadge({ icon, label, variant = "default" }: TrustBadgeProps) {
  const variantClasses = {
    default: "bg-white text-slate-700 border-slate-200 shadow-sm hover:border-primary/30",
    glass: "bg-white/10 backdrop-blur-md text-white border-white/20 shadow-xl hover:bg-white/20"
  };

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold border transition-all duration-200 min-h-[44px]", 
      variantClasses[variant]
    )}>
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </div>
  );
}
