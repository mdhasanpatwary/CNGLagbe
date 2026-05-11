"use client";

import React from "react";
import { motion } from "framer-motion";

export interface RevealProps {
  children: React.ReactNode;
  delay?: number;
}

/**
 * Scroll-triggered fade-in animation component
 * Respects prefers-reduced-motion preference
 * 
 * @param children - Content to reveal
 * @param delay - Animation delay in seconds (default: 0)
 */
export function Reveal({ children, delay = 0 }: RevealProps) {
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  if (prefersReducedMotion) {
    return <div>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  );
}
