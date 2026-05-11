"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, User as UserIcon } from "lucide-react";
import { Tilt } from "@/components/ui/Tilt";

export interface ReviewCardProps {
  name: string;
  location: string;
  text: string;
}

/**
 * Testimonial review card component with 3D tilt effect
 * 
 * @param name - Reviewer name
 * @param location - Reviewer location
 * @param text - Review text content
 */
export function ReviewCard({ name, location, text }: ReviewCardProps) {
  return (
    <Tilt className="h-full">
      <motion.div
        className="bg-white rounded-3xl p-6 premium-card-shadow-hover border border-slate-100 flex flex-col items-center text-center gap-4 min-h-[260px] h-full"
      >
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <p className="text-slate-700 font-bn text-base leading-relaxed italic flex-1">&quot;{text}&quot;</p>
        <div className="flex flex-col items-center gap-2 mt-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-white shadow-sm shrink-0">
            <UserIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{name}</p>
            <p className="text-sm text-slate-600 font-medium">{location}</p>
          </div>
        </div>
      </motion.div>
    </Tilt>
  );
}
