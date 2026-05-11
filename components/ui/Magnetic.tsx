"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

export interface MagneticProps {
  children: React.ReactNode;
}

/**
 * Magnetic hover effect component
 * Creates a magnetic pull effect toward the cursor on desktop
 * Respects prefers-reduced-motion preference
 * 
 * @param children - Content to apply magnetic effect to
 */
export function Magnetic({ children }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const { x, y } = position;

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  if (prefersReducedMotion) {
    return <div ref={ref}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 120, damping: 20, mass: 0.1 }}
    >
      {children}
    </motion.div>
  );
}
