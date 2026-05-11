"use client";

import React from "react";
import { motion } from "framer-motion";
import { Route, ArrowRight } from "lucide-react";

export interface RouteCardProps {
  from: string;
  to: string;
  onClick: () => void;
}

/**
 * Popular route card component
 * 
 * @param from - Origin location
 * @param to - Destination location
 * @param onClick - Click handler for booking initiation
 */
export function RouteCard({ from, to, onClick }: RouteCardProps) {
  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1 }
      }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="inline-flex items-center gap-2 sm:gap-2 bg-white rounded-full px-4 sm:px-5 py-2.5 sm:py-3 shadow-sm border border-slate-200 hover:border-primary hover:bg-primary hover:text-white hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-semibold font-bn min-h-[44px] group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 overflow-hidden"
      aria-label={`Book CNG from ${from} to ${to}`}
    >
      <Route className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-white transition-colors duration-200 shrink-0" />
      <span className="whitespace-nowrap truncate max-w-[120px] sm:max-w-none">{from}</span>
      <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-white/70 transition-colors duration-200 shrink-0" />
      <span className="whitespace-nowrap truncate max-w-[120px] sm:max-w-none">{to}</span>
    </motion.button>
  );
}
