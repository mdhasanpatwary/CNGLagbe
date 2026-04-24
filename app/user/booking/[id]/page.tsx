"use client";

import { useEffect, useState, use } from "react";
import { Loader2, CheckCircle2, User as UserIcon, Phone, Search, Banknote, Navigation, XCircle, Info, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AppButton } from "@/components/ui/AppButton";
import { Card, CardContent } from "@/components/ui/card";
import { useLang } from "@/hooks/useLang";
import { supabase } from "@/lib/supabase";
import { useRef } from "react";
import { ReportModal } from "@/components/ReportModal";
import { CancelModal } from "@/components/CancelModal";

import { useQuery } from "@tanstack/react-query";

interface Booking {
  id: string;
  status: "PENDING" | "ACCEPTED" | "COMPLETED" | "CANCELLED" | "TIMED_OUT";
  fare: number;
  pickupLat: number;
  pickupLng: number;
  destLat: number;
  destLng: number;
  driver?: {
    name: string;
    phone: string;
    vehicleNumber?: string;
    photoUrl?: string;
  } | null;
}

export default function UserBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useLang();
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const driverMarker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  // ─── React Query for Booking Status ───────────────────────────────────────
  const { data: bookingData, refetch: fetchBooking } = useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      const res = await fetch(`/api/booking/${id}`);
      if (!res.ok) throw new Error(t("error"));
      const data = await res.json();
      return data.booking as Booking;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "COMPLETED" || status === "CANCELLED" || status === "TIMED_OUT") {
        return false;
      }
      return 10000; // 10s polling for status
    },
    staleTime: 5000,
  });

  const booking = bookingData || null;



  // Countdown timer for PENDING bookings
  useEffect(() => {
    if (booking?.status !== "PENDING") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Timeout reached, refresh to get updated status
          fetchBooking();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [booking?.status, fetchBooking]);

  // ─── Real-time Driver Tracking & Status Sync ──────────────────────────────
  useEffect(() => {
    if (!booking) return;

    // 1. Subscribe to location and status updates
    const channel = supabase.channel(`booking-${id}`)
      .on("broadcast", { event: "location" }, ({ payload }) => {
        if (booking.status === "ACCEPTED") {
          setDriverLocation(payload);
          if (driverMarker.current) {
            driverMarker.current.position = payload;
          }
        }
      })
      .on("broadcast", { event: "status_change" }, () => {
        // High priority re-fetch when status changes
        void fetchBooking();
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
          content: new PinElement({ background: "#10b981", borderColor: "#065f46", glyphColor: "white" }),
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
  }, [id, booking, driverLocation, fetchBooking]);

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
          booking.status === "PENDING" && countdown > 0 ? "secondary" :
          booking.status === "ACCEPTED" ? "default" : "outline"
        } className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-none ${
          booking.status === "PENDING" && countdown > 0 ? "bg-amber-100 text-amber-700" : 
          booking.status === "ACCEPTED" ? "bg-blue-100 text-blue-700" : 
          "bg-emerald-100 text-emerald-700"}`}
        >
          {booking.status === "PENDING" && countdown > 0 ? t("pending") : 
           booking.status === "ACCEPTED" ? t("ongoing") : 
           booking.status === "COMPLETED" ? t("finish") : 
           booking.status === "TIMED_OUT" ? "No Driver" : 
           countdown === 0 ? "No Driver" : booking.status}
        </Badge>
      </header>
      
      <main className="flex-1 p-6 max-w-md mx-auto w-full">
        
        {/* Status Graphic */}
        <div className="flex flex-col items-center justify-center py-8">
          {(booking.status === "PENDING" || countdown === 0) && (
            <>
              {countdown > 0 ? (
                <>
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-[ping_3s_linear_infinite]" />
                    <div className="absolute inset-4 rounded-full bg-emerald-500/10 animate-[ping_2s_linear_infinite]" />
                    <div className="bg-white p-10 rounded-full relative shadow-2xl border border-emerald-50 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                      <Search className="w-12 h-12 text-emerald-600 animate-pulse" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 mt-8 mb-2 tracking-tight">{t("finding_driver")}</h2>
                  <p className="text-slate-500 text-center text-sm px-4 font-medium opacity-70 uppercase tracking-widest mb-4">{t("wait_requests")}</p>
                  <div className="bg-amber-50 px-4 py-2 rounded-full border border-amber-200 mb-6">
                    <div className="text-amber-700 text-center text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      {countdown > 0 ? `Timeout in ${countdown}s` : "No driver found"}
                    </div>
                  </div>
                  <AppButton 
                    variant="secondary" 
                    onClick={() => setShowCancel(true)} 
                    className="rounded-full border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Cancel Request
                  </AppButton>
                </>
              ) : (
                <>
                  <div className="bg-orange-100 p-8 rounded-full">
                    <AlertTriangle className="w-16 h-16 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 mt-8 mb-2">No Driver Found</h2>
                  <p className="text-slate-500 text-center text-sm px-4 font-medium mb-4">No drivers available at this time</p>
                  <Link href="/user/map">
                    <AppButton variant="secondary" className="rounded-full">
                      Try Again
                    </AppButton>
                  </Link>
                </>
              )}
            </>
          )}

          {booking.status === "ACCEPTED" && (
            <div className="w-full">
              <div ref={mapRef} className="w-full h-80 rounded-3xl shadow-2xl border-4 border-white overflow-hidden mb-8 relative">
                 <div className="absolute top-4 left-4 z-10 bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
                    <Navigation size={12} fill="white" /> {t("wait_driver")}
                 </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 p-8 rounded-full shadow-inner animate-in zoom-in-50 duration-500 flex items-center justify-center">
                  <CheckCircle2 className="w-16 h-16 text-blue-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mt-8 mb-2">{t("dr_on_way")}</h2>
                <p className="text-slate-500 text-center text-xs px-4 font-black uppercase tracking-widest opacity-60 underline decoration-blue-500 decoration-2 underline-offset-4">{t("drivers_desc")}</p>
              </div>
            </div>
          )}

          {booking.status === "COMPLETED" && (
            <>
              <div className="bg-emerald-100 p-8 rounded-[2.5rem] animate-in zoom-in-50 duration-500 shadow-2xl shadow-emerald-500/20">
                <CheckCircle2 className="w-16 h-16 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-black text-emerald-600 mt-8 mb-2 uppercase tracking-tighter">{t("booking_done")}</h2>
              <div className="bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 mb-6">
                <p className="text-emerald-700 text-center text-xs font-black uppercase tracking-widest flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   {t("driver_arrived_desc")}
                </p>
              </div>
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
          <Card className="mb-6 shadow-2xl shadow-slate-200/50 border-none rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-sm">
             <CardContent className="p-6">
               <div className="flex items-center gap-5 border-b border-slate-100 pb-5 mb-5">
                  <div className="relative">
                    <div className="bg-slate-100 w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                      {booking.driver.photoUrl ? (
                         // eslint-disable-next-line @next/next/no-img-element
                         <img src={booking.driver.photoUrl} alt={booking.driver.name} className="w-full h-full object-cover" />
                      ) : (
                         <UserIcon className="w-8 h-8 text-slate-500" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                       <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">{t("auto_rickshaw")}</p>
                     <h3 className="font-black text-xl text-slate-800 truncate">{booking.driver.name}</h3>
                     {booking.driver.vehicleNumber && (
                        <div className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-[9px] font-black px-2.5 py-1 rounded-md mt-2 shadow-sm uppercase tracking-wider">
                           {t("vehicle_no")}: {booking.driver.vehicleNumber}
                        </div>
                     )}
                  </div>
               </div>
               <a href={`tel:${booking.driver.phone}`} className="flex items-center justify-center gap-3 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition active:scale-95 text-sm uppercase tracking-widest">
                  <Phone className="w-4 h-4" />
                  {t("call_driver")}
               </a>
             </CardContent>
          </Card>
        )}

        {/* Fare Card */}
        <Card className={`mb-6 border-none shadow-2xl rounded-[2.5rem] overflow-hidden transition-all duration-500 ${
          booking.status === "COMPLETED" ? "ring-4 ring-emerald-500/20 bg-emerald-50/50 scale-[1.02]" : "bg-white"
        }`}>
           <CardContent className="p-8">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-600 shadow-inner">
                    <Banknote size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">{t("fixed_fare")}</p>
                    {booking.status === "COMPLETED" && (
                       <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle2 size={10} /> {t("fare_final")}
                       </p>
                    )}
                  </div>
                </div>
                {/* Tooltip icon */}
                <div className="relative group">
                  <div className="bg-slate-50 p-2 rounded-full text-slate-300 group-hover:bg-slate-100 group-hover:text-slate-500 transition cursor-help border border-slate-100">
                    <Info size={16} />
                  </div>
                  <div className="absolute bottom-full right-0 mb-4 w-60 bg-slate-900/95 backdrop-blur-md text-white text-[10px] leading-relaxed rounded-2xl px-5 py-4 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-y-1 group-hover:translate-y-0 z-50 border border-white/10 ring-1 ring-white/5">
                    {t("fare_desc")}
                    <div className="absolute top-full right-3 border-[6px] border-transparent border-t-slate-900/95" />
                  </div>
                </div>
             </div>
             
             <div className="flex items-end justify-between gap-4">
                <div className="flex flex-col">
                  <h3 className="text-5xl font-black text-slate-900 flex items-center gap-1.5 tracking-tighter">
                    <span className="text-emerald-500 text-3xl font-bold">{t("currency")}</span>
                    {booking.fare}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-1">{t("bdt")}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                <div className="flex flex-col items-end gap-1.5">
                   <Badge className="bg-emerald-600 text-white border-none font-black text-[10px] px-4 py-2 rounded-xl shadow-lg shadow-emerald-600/20 uppercase tracking-widest h-auto whitespace-nowrap">
                      {t("cash_only")}
                   </Badge>
                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t("pay_driver")}</span>
                </div>
                   {booking.status === "COMPLETED" && (
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest animate-pulse opacity-60">
                         {t("safe_trip")}
                      </span>
                   )}
                </div>
             </div>
             
             {booking.status === "COMPLETED" && (
                <div className="mt-8 pt-6 border-t border-emerald-100 flex flex-col items-center gap-4">
                   <div className="flex items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg">
                         <Banknote size={16} />
                      </div>
                      <p className="text-sm font-black text-emerald-700 uppercase tracking-tight">
                         {t("pay_driver")}: {t("currency")}{booking.fare}
                      </p>
                   </div>
                   <Badge variant="outline" className="border-emerald-100 text-emerald-600 text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full bg-emerald-50/50">
                      {t("cash_only")}
                   </Badge>
                </div>
             )}
           </CardContent>
        </Card>
        
        {booking.status === "COMPLETED" && (
           <Link href="/">
             <AppButton className="w-full mt-8 h-14 text-lg rounded-xl shadow-lg" leftIcon={<Navigation size={20} />}>
               {t("set_pickup")}
             </AppButton>
           </Link>
        )}

        {booking.status === "COMPLETED" && (
           <AppButton 
             variant="ghost" 
             onClick={() => setShowReport(true)}
             className="w-full mt-4 h-12 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-100"
             leftIcon={<AlertTriangle size={14} />}
           >
             {t("report_issue")}
           </AppButton>
        )}

        {(booking.status === "CANCELLED" || (booking.status === "PENDING" && !booking.driver)) && (
          <Link href="/">
            <AppButton variant="secondary" className="w-full mt-4 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest">
              {t("bk_another")}
            </AppButton>
          </Link>
        )}

        {(booking.status === "PENDING" || booking.status === "ACCEPTED") && (
          <AppButton 
            variant="ghost" 
            onClick={() => setShowCancel(true)}
            className="w-full mt-4 h-12 text-red-400 font-black uppercase tracking-widest text-[10px] hover:bg-red-50 hover:text-red-500"
            leftIcon={<XCircle size={14} />}
          >
            {t("cancel_booking")}
          </AppButton>
        )}

      </main>

      {showReport && (
        <ReportModal bookingId={id} onClose={() => setShowReport(false)} />
      )}

      {showCancel && (
        <CancelModal 
          bookingId={id} 
          role="USER"
          onClose={() => setShowCancel(false)} 
          onSuccess={() => {
            setShowCancel(false);
            window.location.reload();
          }} 
        />
      )}
      
      <footer className="p-6 text-center text-slate-400 text-[10px] font-medium tracking-widest uppercase">
        {t("app_name")} &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
