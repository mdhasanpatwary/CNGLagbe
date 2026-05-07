"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AppButton } from "@/components/ui/AppButton";

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  error?: string;
  icon?: React.ElementType;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  label,
  placeholder = "Search...",
  error,
  icon: Icon = MapPin,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [openUpwards, setOpenUpwards] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // If less than 300px below and more space above, open upwards
      if (spaceBelow < 300 && spaceAbove > spaceBelow) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-2" ref={containerRef}>
      <div className="flex justify-between items-center ml-1">
        <label className="text-xs font-black tracking-widest text-slate-400 uppercase">
          {label}
        </label>
        {error && (
          <span className="text-[10px] font-bold text-red-500 tracking-wider animate-in fade-in slide-in-from-right-1">
            {error}
          </span>
        )}
      </div>

      <div className="relative group">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-14 flex items-center gap-3 px-5 transition-all rounded-2xl text-lg w-full font-medium border-2 cursor-pointer",
            error 
              ? "bg-red-50/50 border-red-200 text-red-900" 
              : isOpen 
                ? "bg-white border-primary shadow-lg shadow-primary/5" 
                : "bg-slate-50 border-slate-100 hover:border-slate-200"
          )}
        >
          <Icon className={cn("shrink-0 transition-colors", isOpen ? "text-primary" : "text-slate-400")} size={20} />
          
          <div className="flex-1 truncate">
            {value ? (
              <span className="text-slate-900">{value}</span>
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </div>

          <ChevronDown 
            size={20} 
            className={cn("text-slate-400 transition-transform duration-300", isOpen && "rotate-180 text-primary")} 
          />
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: openUpwards ? 10 : -10, scale: 0.95 }}
              animate={{ opacity: 1, y: openUpwards ? -4 : 4, scale: 1 }}
              exit={{ opacity: 0, y: openUpwards ? 10 : -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                "absolute left-0 right-0 z-[999] bg-white border border-slate-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden",
                openUpwards ? "bottom-full mb-2" : "top-full mt-2"
              )}
            >
              <div className="p-3 border-b border-slate-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    autoFocus
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Type to search..."
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {search && (
                    <AppButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearch("");
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 h-auto w-auto border-none"
                      variant="ghost"
                      leftIcon={<X size={14} />}
                    />
                  )}
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto p-2">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <div
                      key={option}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(option);
                        setIsOpen(false);
                        setSearch("");
                      }}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all mb-1",
                        value === option 
                          ? "bg-primary/5 text-primary font-bold" 
                          : "hover:bg-slate-50 text-slate-600"
                      )}
                    >
                      <span className="text-sm">{option}</span>
                      {value === option && <Check size={16} />}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-slate-400 font-medium">No bazars found</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
