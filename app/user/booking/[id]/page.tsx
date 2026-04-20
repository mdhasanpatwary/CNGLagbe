"use client";

import { useEffect, useState, use } from "react";
import { Loader2, CheckCircle2, User as UserIcon, Phone, Search, Banknote, Navigation, XCircle, Info, Home } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLang } from "@/hooks/useLang";
import { supabase } from "@/lib/supabase";
import { useRef } from "react";
import { StaticMap } from "@/components/StaticMap";

interface Booking {
  id: string;
  status: "PENDING" | "ACCEPTED" | "COMPLETED" | "CANCELLED";
  fare: number;
  pickupLat: number;
  pickupLng: number;
  destLat: number;
  destLng: number;
  driver?: {
    name: string;
    phone: string;
  } | null;
}

export default function UserBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useLang();
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const driverMarker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/booking/${id}`);
        if (!res.ok) throw new Error(t("error"));
        const data = await res.json();
        setBooking(data.booking);

        if (data.booking.status === "COMPLETED" || data.booking.status === "CANCELLED") {
           clearInterval(intervalId);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        clearInterval(intervalId);
      }
    };

    fetchBooking();
    // Poll for status updates (less frequently now)
    const intervalId = setInterval(fetchBooking, 10000);

    return () => clearInterval(intervalId);
  }, [id, t]);

  // ─── Real-time Driver Tracking ───────────────────────────────────────────
  useEffect(() => {
    if (!booking || booking.status !== "ACCEPTED") return;

    // 1. Subscribe to location updates
    const channel = supabase.channel(`booking-${id}`)
      .on("broadcast", { event: "location" }, ({ payload }) => {
        setDriverLocation(payload);
        if (driverMarker.current) {
          driverMarker.current.position = payload;
        }
      })
      .subscribe();

    // 2. Load Google Maps if not already loaded
    const initMap = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey || !mapRef.current) return;

      if (!window.google?.maps?.importLibrary) {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,geometry&v=weekly`;
        script.async = true;
        document.head.appendChild(script);
        await new Promise((resolve) => (script.onload = resolve));
      }

      const { Map } = await window.google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

      if (!mapInstance.current) {
        mapInstance.current = new Map(mapRef.current, {
          center: { lat: booking.pickupLat, lng: booking.pickupLng },
          zoom: 15,
          mapId: "DEMO_MAP_ID",
          disableDefaultUI: true,
        });

        // Pickup Marker
        new AdvancedMarkerElement({
          map: mapInstance.current,
          position: { lat: booking.pickupLat, lng: booking.pickupLng },
          title: "Pickup",
          content: new PinElement({ background: "#10b981", borderColor: "#065f46", glyphColor: "white" }).element,
        });
      }

      if (driverLocation && !driverMarker.current) {
        const cngIcon = document.createElement("div");
        cngIcon.innerHTML = `<div class="bg-blue-600 p-2 rounded-full shadow-lg border-2 border-white"><span class="text-xs">🛺</span></div>`;
        
        driverMarker.current = new AdvancedMarkerElement({
          map: mapInstance.current,
          position: driverLocation,
          title: "Driver",
          content: cngIcon,
        });
      }
    };

    initMap();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, booking, driverLocation]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-screen text-center">
        <div className="bg-red-100 text-red-500 rounded-full p-4 mb-4">
           <XCircle size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2">{t("error")}</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <Link href="/" className={buttonVariants({ variant: "secondary", className: "rounded-full" })}>
           <Home size={16} className="mr-2" /> {t("back_home")}
        </Link>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-slate-500 font-bold">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white p-4 shadow-sm border-b flex items-center justify-between sticky top-0 z-10">
        <h1 className="font-bold text-slate-800 flex items-center gap-2">
          <Navigation size={18} className="text-emerald-500" />
          #{id.slice(-6).toUpperCase()}
        </h1>
        <Badge variant={
          booking.status === "PENDING" ? "secondary" :
          booking.status === "ACCEPTED" ? "default" : "outline"
        } className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-none ${
          booking.status === "PENDING" ? "bg-amber-100 text-amber-700" : 
          booking.status === "ACCEPTED" ? "bg-blue-100 text-blue-700" : 
          "bg-emerald-100 text-emerald-700"}`}
        >
          {booking.status === "PENDING" ? t("pending") : 
           booking.status === "ACCEPTED" ? t("ongoing") : 
           booking.status === "COMPLETED" ? t("finish") : booking.status}
        </Badge>
      </header>
      
      <main className="flex-1 p-6 max-w-md mx-auto w-full">
        
        {/* Status Graphic */}
        <div className="flex flex-col items-center justify-center py-8">
          {booking.status === "PENDING" && (
            <>
              <div className="relative">
                <div className="absolute inset-0 rounded-full animate-ping bg-emerald-400 opacity-20"></div>
                <div className="bg-emerald-100 p-8 rounded-full relative">
                  <Search className="w-16 h-16 text-emerald-600 animate-pulse" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-slate-800 mt-8 mb-2">{t("wait_requests")}</h2>
              <p className="text-slate-500 text-center text-sm px-4 font-medium">{t("cng_desc")}</p>
            </>
          )}

          {booking.status === "ACCEPTED" && (
            <div className="w-full">
              <div ref={mapRef} className="w-full h-64 rounded-2xl shadow-inner border border-slate-200 overflow-hidden mb-6" />
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 p-8 rounded-full shadow-inner animate-in zoom-in-50 duration-500">
                  <CheckCircle2 className="w-16 h-16 text-blue-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mt-8 mb-2">{t("driver_accepted")}</h2>
                <p className="text-slate-500 text-center text-sm px-4 font-medium">{t("drivers_desc")}</p>
              </div>
            </div>
          )}

          {booking.status === "COMPLETED" && (
            <>
              <div className="bg-emerald-100 p-8 rounded-full animate-in zoom-in-50 duration-500">
                <CheckCircle2 className="w-16 h-16 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mt-8 mb-2">{t("finish")}</h2>
              <p className="text-slate-500 text-center text-sm px-4 font-medium">{t("reliable_drivers")}</p>
            </>
          )}
          
          {booking.status === "CANCELLED" && (
            <>
              <div className="bg-red-100 p-8 rounded-full">
                <XCircle className="w-16 h-16 text-red-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mt-8 mb-2">{t("reject")}</h2>
              <p className="text-slate-500 text-center text-sm px-4 font-medium">{t("error")}</p>
            </>
          )}
        </div>

        {/* Driver Card */}
        {(booking.status === "ACCEPTED" || booking.status === "COMPLETED") && booking.driver && (
          <Card className="mb-6 shadow-md border-slate-100 rounded-2xl overflow-hidden">
             <CardContent className="p-5">
               <div className="flex items-center gap-4 border-b border-slate-50 pb-4 mb-4">
                  <div className="bg-slate-100 p-3 rounded-full">
                    <UserIcon className="w-8 h-8 text-slate-500" />
                  </div>
                  <div>
                     <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1">{t("reliable_drivers")}</p>
                     <h3 className="font-bold text-xl text-slate-800">{booking.driver.name}</h3>
                  </div>
               </div>
               <a href={`tel:${booking.driver.phone}`} className="flex items-center justify-center gap-3 bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition active:scale-95">
                  <Phone className="w-5 h-5" />
                  {t("call_driver")}
               </a>
             </CardContent>
          </Card>
        )}

        {/* Fare Card */}
        <Card className="shadow-sm border-slate-100 rounded-2xl">
           <CardContent className="p-6">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                    <Banknote size={16} />
                  </div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-black">{t("fixed_fare")}</p>
                </div>
                {/* Tooltip icon */}
                <div className="relative group">
                  <div className="bg-slate-100 p-1.5 rounded-full text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600 transition cursor-help">
                    <Info size={14} />
                  </div>
                  <div className="absolute bottom-full right-0 mb-3 w-56 bg-slate-900/95 backdrop-blur-sm text-white text-[10px] leading-relaxed rounded-xl px-4 py-3 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-y-1 group-hover:translate-y-0 z-50 border border-white/10">
                    {t("fare_desc")}
                    <div className="absolute top-full right-2 border-[6px] border-transparent border-t-slate-900/95" />
                  </div>
                </div>
             </div>
             
             <div className="flex items-center justify-between">
                <h3 className="text-4xl font-black text-slate-900 flex items-center gap-1">
                  <span className="text-emerald-500 text-2xl font-bold">{t("currency")}</span>
                  {booking.fare}
                </h3>
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-md font-bold text-slate-400 border-slate-200 bg-slate-50">
                  {t("currency_name")}
                </Badge>
             </div>
             
             <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-slate-400">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <p className="text-[10px] font-bold uppercase tracking-wider">{t("fare_desc")}</p>
             </div>
           </CardContent>
        </Card>
        
        {booking.status === "COMPLETED" && (
           <Link href="/" className={buttonVariants({ className: "w-full mt-8 h-14 text-lg rounded-xl shadow-lg", size: "lg" })}>
             <Navigation size={20} className="mr-2" /> {t("set_pickup")}
           </Link>
        )}

      </main>
      
      <footer className="p-6 text-center text-slate-400 text-[10px] font-medium tracking-widest uppercase">
        {t("app_name")} &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
