import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeadingProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
  backHref?: string;
}

/**
 * A premium, highly stylized page heading component.
 * Features:
 * - Optional back navigation button
 * - Dynamic primary color bar with glow
 * - High-contrast black typography
 * - Subtle glassmorphism and animations
 * - Responsive alignment
 */
export function PageHeading({ title, subtitle, centered = false, className, backHref }: PageHeadingProps) {
  return (
    <div className={cn(
      "mb-8 relative flex flex-col gap-1",
      centered ? "items-center text-center" : "items-start",
      className
    )}>
      <div className={cn("flex items-center gap-3", centered && "justify-center")}>
        {/* Back Button */}
        {backHref && (
          <Link 
            href={backHref}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center text-slate-500 hover:text-slate-900"
            aria-label="Go back"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </Link>
        )}

        {/* Visual Accent */}
        {!backHref && <div className="w-1 h-7 bg-primary rounded-full" />}
        
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 uppercase">
          {title}
        </h1>
      </div>

      {/* Subtitle / Context */}
      {subtitle && (
        <p className={cn(
          "text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400",
          centered ? "text-center" : (backHref ? "pl-2" : "pl-[16px]")
        )}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
