"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { Reveal } from "./Reveal";

export interface SectionHeadingProps {
  title: string;
  sub?: string;
  light?: boolean;
}

/**
 * Section heading component with consistent typography and animation
 * Respects prefers-reduced-motion preference
 * 
 * @param title - Main heading text
 * @param sub - Optional subtitle text
 * @param light - Use light theme (white text) for dark backgrounds
 */
export function SectionHeading({ title, sub, light }: SectionHeadingProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 15 }}
      whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="text-center mb-8 sm:mb-12 md:mb-16 px-2 sm:px-0"
    >
      <h2 className={cn(
        "text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight font-bn mb-3 sm:mb-4",
        light ? "text-white" : "text-slate-900"
      )}>
        {title}
      </h2>
      {sub && (
        <Reveal delay={0.4}>
          <p className={cn(
            "text-xs sm:text-sm font-normal max-w-2xl mx-auto font-bn leading-relaxed",
            light ? "text-slate-300" : "text-slate-600"
          )}>
            {sub}
          </p>
        </Reveal>
      )}
    </motion.div>
  );
}
