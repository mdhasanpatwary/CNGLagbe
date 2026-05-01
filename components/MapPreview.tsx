"use client";

import { useEffect, useRef, useState } from "react";
import { COLORS } from "@/constants/colors";

interface MapPreviewProps {
  pickup: { lat: number; lng: number };
  drop: { lat: number; lng: number };
  polyline?: string;
}

export function MapPreview({ pickup, drop, polyline }: MapPreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    // Load Leaflet from CDN if not already loaded
    if (typeof window === "undefined") return;

    const loadLeaflet = () => {
      if (window.L) {
        setLeafletLoaded(true);
        return;
      }

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    };

    loadLeaflet();
  }, []);

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || !window.L) return;

    const L = window.L;

    // Initialize map
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
    });

    // Add Free OSM Tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Create custom icons (basic but distinct)
    const pickupIcon = L.divIcon({
      html: `<div style="background-color: ${COLORS.pickup}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
      className: "",
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    const dropIcon = L.divIcon({
      html: `<div style="background-color: ${COLORS.drop}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
      className: "",
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    // Add Markers
    L.marker([pickup.lat, pickup.lng], { icon: pickupIcon }).addTo(map);
    L.marker([drop.lat, drop.lng], { icon: dropIcon }).addTo(map);

    // Add Polyline if available (Google Polyline format needs decoding)
    if (polyline) {
      try {
        // Simple decoder for Google Encoded Polyline
        const points = decodePolyline(polyline);
        L.polyline(points, { color: COLORS.route, weight: 4, opacity: 0.7 }).addTo(map);
      } catch {
        // Fallback: draw straight line if decoding fails
        L.polyline([[pickup.lat, pickup.lng], [drop.lat, drop.lng]], { 
          color: COLORS.route, 
          weight: 4, 
          opacity: 0.5,
          dashArray: "5, 10" 
        }).addTo(map);
      }
    } else {
      // Straight dashed line fallback
      L.polyline([[pickup.lat, pickup.lng], [drop.lat, drop.lng]], { 
        color: COLORS.route, 
        weight: 4, 
        opacity: 0.5,
        dashArray: "5, 10" 
      }).addTo(map);
    }

    // Fit bounds
    const bounds = L.latLngBounds([[pickup.lat, pickup.lng], [drop.lat, drop.lng]]);
    map.fitBounds(bounds, { padding: [20, 20] });

    return () => {
      map.remove();
    };
  }, [leafletLoaded, pickup, drop, polyline]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner">
      <div ref={mapRef} className="w-full h-full" />
      {!leafletLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full" />
        </div>
      )}
    </div>
  );
}

// Helper to decode Google Encoded Polyline
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

// Add L to window type
declare global {
  interface Window {
    L: {
      map: (el: HTMLElement | null, options: Record<string, unknown>) => {
        fitBounds: (bounds: unknown, options?: Record<string, unknown>) => void;
        remove: () => void;
      };
      tileLayer: (url: string, options?: Record<string, unknown>) => { addTo: (map: unknown) => void };
      divIcon: (options: Record<string, unknown>) => unknown;
      marker: (coords: [number, number], options?: Record<string, unknown>) => { addTo: (map: unknown) => void };
      polyline: (points: [number, number][], options?: Record<string, unknown>) => { addTo: (map: unknown) => void };
      latLngBounds: (points: [number, number][]) => unknown;
    };
  }
}
