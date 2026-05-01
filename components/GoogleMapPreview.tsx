"use client";

import React, { useState, useEffect } from "react";
import { Maximize2, X } from "lucide-react";
import { AppButton } from "./ui/AppButton";

interface GoogleMapPreviewProps {
  pickupLat: number;
  pickupLng: number;
  destLat: number;
  destLng: number;
  apiKey: string;
  className?: string;
}

export function GoogleMapPreview({
  pickupLat,
  pickupLng,
  destLat,
  destLng,
  apiKey,
  className = "",
}: GoogleMapPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const origin = `${pickupLat},${pickupLng}`;
  const destination = `${destLat},${destLng}`;
  const src = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${origin}&destination=${destination}&mode=driving`;

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded(false);
    };
    if (isExpanded) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden"; // Prevent scrolling
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isExpanded]);

  const mapContent = (
    <iframe
      width="100%"
      height="100%"
      style={{ border: 0 }}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      src={src}
      className={isExpanded ? "w-full h-full" : "absolute inset-0"}
    />
  );

  return (
    <>
      <div className={`relative w-full h-full min-h-[250px] bg-slate-100 rounded-xl overflow-hidden group ${className}`}>
        {mapContent}
        
        {/* Expand Button */}
        <AppButton
          onClick={() => setIsExpanded(true)}
          className="absolute top-3 right-3 bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-lg border border-slate-200 text-slate-700 hover:bg-white hover:scale-105 transition-all duration-300 z-10 w-10 h-10 flex items-center justify-center"
          title="Full Screen"
          variant="outline"
          leftIcon={<Maximize2 size={20} />}
        />

        {/* Overlay to prevent accidental scrolls while viewing small map */}
        <div className="absolute inset-0 pointer-events-none border border-slate-200" />
      </div>

      {/* Fullscreen Overlay */}
      {isExpanded && (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col animate-in fade-in zoom-in duration-300">
          <div className="p-4 bg-white border-b flex items-center justify-between shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Maximize2 size={18} className="text-emerald-500" />
              Detailed Map View
            </h3>
            <AppButton
              variant="ghost"
              onClick={() => setIsExpanded(false)}
              className="text-slate-500 hover:bg-slate-100 h-10 w-10 p-0 rounded-full"
              leftIcon={<X size={24} />}
            />
          </div>
          <div className="flex-1 relative bg-slate-50">
            {mapContent}
          </div>
          <div className="p-4 bg-slate-900 text-white text-center text-xs font-medium">
            Press <kbd className="bg-slate-700 px-2 py-0.5 rounded border border-slate-600">ESC</kbd> to exit full screen
          </div>
        </div>
      )}
    </>
  );
}
