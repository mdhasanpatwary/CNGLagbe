"use client";

import React from "react";
import { motion, useMotionValue, useMotionTemplate } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export interface SectionProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
  noPadding?: boolean;
  style?: React.CSSProperties;
  variant?: "default" | "mesh" | "premium" | "white" | "slate" | "glass" | "dark" | "primary" | "subtle";
}

/**
 * Section wrapper component with spotlight effect and consistent styling
 * Respects prefers-reduced-motion preference
 * 
 * @param id - Optional section ID for anchor linking
 * @param className - Additional CSS classes
 * @param children - Section content
 * @param noPadding - Remove default padding from inner container
 * @param style - Inline styles
 * @param variant - Background variant style
 */
export function Section({ 
  id, 
  className, 
  children, 
  noPadding, 
  style, 
  variant = "default" 
}: SectionProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleMouseMove = ({ clientX, clientY, currentTarget }: React.MouseEvent) => {
    if (prefersReducedMotion) return;
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  const variantClasses = {
    default: "bg-slate-50",
    mesh: "mesh-gradient noise-bg",
    premium: "premium-bg-surface noise-bg",
    white: "bg-white",
    slate: "bg-slate-50 dot-grid-texture",
    glass: "glass-morphism",
    dark: "bg-slate-950 text-white noise-bg",
    primary: "bg-gradient-to-br from-primary to-primary-dark text-white noise-bg",
    subtle: "bg-slate-50/50 backdrop-blur-sm",
  };

  return (
    <section
      id={id}
      onMouseMove={handleMouseMove}
      className={cn("px-4 sm:px-6 md:px-8 py-16 md:py-24 relative overflow-hidden group/section", variantClasses[variant], className)}
      style={style}
    >
      {/* Spotlight Effect */}
      {!prefersReducedMotion && (
        <motion.div
          className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover/section:opacity-100 z-0"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                650px circle at ${mouseX}px ${mouseY}px,
                rgba(11, 122, 60, ${variant === "dark" || variant === "primary" ? "0.1" : "0.05"}),
                transparent 80%
              )
            `,
          }}
        />
      )}

      {/* Universal texture overlay */}
      <div className={cn(
        "absolute inset-0 pointer-events-none opacity-[0.03] dot-grid-texture",
        variant === "dark" || variant === "primary" ? "opacity-[0.05] invert" : ""
      )} />

      {/* Subtle top divider for certain variants */}
      {(variant === "white" || variant === "slate") && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50" />
      )}
      
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
        whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={cn("max-w-[1200px] mx-auto w-full relative z-10", noPadding && "px-0")}
      >
        {children}
      </motion.div>
    </section>
  );
}
