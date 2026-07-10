"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
import { cn } from "@/lib/utils";

export interface FaqItemProps {
  question: string;
  answer: string;
  isOpen?: boolean;       // optional: controlled open state
  onToggle?: () => void;  // optional: controlled toggle handler
}

/**
 * FAQ accordion item component
 *
 * Supports both uncontrolled (default) and controlled modes.
 * Pass `isOpen` + `onToggle` for controlled mode (e.g. "expand all").
 *
 * @param question - FAQ question text
 * @param answer - FAQ answer text
 * @param isOpen - (controlled) whether item is open
 * @param onToggle - (controlled) toggle callback
 */
export function FaqItem({ question, answer, isOpen, onToggle }: FaqItemProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Controlled mode when isOpen is explicitly provided; else use internal state
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const handleToggle = onToggle ?? (() => setInternalOpen((v) => !v));

  return (
    <div className={cn(
      "border-b border-gray-100 overflow-hidden transition-all duration-200",
      open ? "bg-slate-50/50" : "bg-white"
    )}>
      <AppButton
        variant="ghost"
        fullWidth
        onClick={handleToggle}
        className="flex items-center justify-between py-5 px-4 text-left font-semibold text-slate-900 text-base gap-4 h-auto rounded-none border-none hover:bg-slate-50/70 focus:ring-2 focus:ring-primary/30 focus:outline-none"
        aria-expanded={open}
      >
        <span className="font-bn flex-1">{question}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          className={cn(
            "w-6 h-6 flex items-center justify-center transition-colors duration-200 shrink-0",
            open ? "text-primary" : "text-slate-400"
          )}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </AppButton>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 text-slate-700 text-sm leading-relaxed font-bn font-normal pt-2">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
