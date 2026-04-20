"use client";

import React from "react";

interface StaticMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  width?: number;
  height?: number;
  className?: string;
  markers?: { lat: number; lng: number; color: string; label?: string }[];
}

export const StaticMap: React.FC<StaticMapProps> = ({
  lat,
  lng,
  zoom = 15,
  width = 600,
  height = 300,
  className = "",
  markers = []
}) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  // Construct markers string
  // Format: markers=color:blue|label:S|11211|11206|11222
  const markerParams = markers.map(m => {
    const color = m.color.replace("#", "0x");
    const label = m.label ? `|label:${m.label.toUpperCase()}` : "";
    return `markers=color:${color}${label}|${m.lat},${m.lng}`;
  }).join("&");

  const url = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&scale=2&maptype=roadmap&${markerParams}&key=${apiKey}`;

  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-100 ${className}`} style={{ width: '100%', aspectRatio: `${width}/${height}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Map preview"
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.05)] pointer-events-none" />
    </div>
  );
};
