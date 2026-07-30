"use client";

import React from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TiltProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * 3D tilt effect component
 * Applies perspective-based 3D rotation on mouse movement
 * Uses CSS transforms for optimal performance
 * 
 * @param children - Content to apply tilt effect to
 * @param className - Additional CSS classes
 */
export function Tilt({ children, className }: TiltProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-100, 100], [-15, 15]);

  const handleMouse = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = (mouseX / width - 0.5) * 200;
    const yPct = (mouseY / height - 0.5) * 200;
    x.set(xPct);
    y.set(yPct);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  // Skip on touch devices (no mouse hover) or reduced motion preference
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  if (prefersReducedMotion || isTouchDevice) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      style={{ 
        rotateX, 
        rotateY, 
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn("perspective-1000", className)}
    >
      <motion.div 
        style={{ 
          transform: "translateZ(50px)", 
          transformStyle: "preserve-3d" 
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
