"use client";

import React from "react";
import { motion } from "framer-motion";
import { Tilt } from "@/components/ui/Tilt";

export interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  sub: string;
}

/**
 * Feature card component with 3D tilt effect
 * 
 * @param icon - Icon element to display
 * @param title - Feature title
 * @param sub - Feature description
 */
export function FeatureCard({ icon, title, sub }: FeatureCardProps) {
  return (
    <Tilt>
      <motion.div
        className="bg-white border border-gray-100 rounded-xl p-4 sm:p-6 premium-card-shadow-hover flex flex-col items-center text-center gap-3 sm:gap-4 focus-within:ring-2 focus-within:ring-primary/30 h-full"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-primary/10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl text-primary shrink-0"
        >
          {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5 sm:w-6 sm:h-6" })}
        </motion.div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 sm:mb-2">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-bn font-normal">{sub}</p>
        </div>
      </motion.div>
    </Tilt>
  );
}
