"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Power, User, MapPin, Navigation, Info, ExternalLink, CheckCircle2, XCircle, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/hooks/useLang";
import { supabase } from "@/lib/supabase";
import { useRef } from "react";

interface RequestItem {
  id: string;
  distance: number;
  fare: number;
  pickupLat: number;
  pickupLng: number;
  destLat: number;
  destLng: number;
  pickupAddress?: string;
  destAddress?: string;
  createdAt: string;
}

interface CurrentBooking {
  id: string;
  pickupLat: number;
  pickupLng: number;
  destLat: number;
  destLng: number;
  pickupAddress?: string;
  destAddress?: string;
  fare: number;
}

export default function DriverDashboard() {
  const router = useRouter();
  const { t } = useLang();
  const [token, setToken] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [isApproved, setIsApproved] = useState(true); // Default to true while loading
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [currentBooking, setCurrentBooking] = useState<CurrentBooking | null>(null);
  const lastLocation = useRef<{ lat: number; lng: number } | null>(null);
  const locationInterval = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const stored = localStorage.getItem("cng_driver_token");
    if (stored) {
      setToken(stored);
    } else {
      router.push("/driver/login");
    }
  }, [router]);

  useEffect(() => {
    if (!token) return;
    
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/driver/status", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIsApproved(data.driver.isApproved);
          setIsOnline(data.driver.isOnline);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [token]);

  useEffect(() => {
    if (!token || !isOnline || !isApproved) return;
    
    const fetchRequests = async () => {
      try {
        const res = await fetch("/api/driver/requests", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) {
           localStorage.removeItem("cng_driver_token");
           router.push("/driver/login");
           return;
        }
        const data = await res.json();
        setRequests(data.requests || []);
        setCurrentBooking(data.currentBooking || null);
      } catch (err) {
        console.error(err);
      }
    };

    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [token, isOnline, isApproved, router]);

  // ─── Real-time Location Push ──────────────────────────────────────────────
  useEffect(() => {
    if (!token || !isOnline || !currentBooking) {
      if (locationInterval.current) {
        clearInterval(locationInterval.current);
        locationInterval.current = null;
      }
      return;
    }

    const pushLocation = () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        
        // Throttling: Only push if moved > 0.0001 degrees (~10 meters)
        if (lastLocation.current) {
          const dLat = Math.abs(lat - lastLocation.current.lat);
          const dLng = Math.abs(lng - lastLocation.current.lng);
          if (dLat < 0.0001 && dLng < 0.0001) return; 
        }

        lastLocation.current = { lat, lng };

        // 1. Update DB (for persistence and user reload)
        try {
          await fetch("/api/driver/location", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ lat, lng })
          });
        } catch (e) { console.error(e); }

        // 2. Broadcast via Supabase Realtime (for true live tracking)
        supabase.channel(`booking-${currentBooking.id}`).send({
          type: "broadcast",
          event: "location",
          payload: { lat, lng }
        });
      }, (err) => console.error(err), { enableHighAccuracy: true });
    };

    locationInterval.current = setInterval(pushLocation, 10000); // Push every 10s if moved
    return () => {
      if (locationInterval.current) clearInterval(locationInterval.current);
    };
  }, [token, isOnline, currentBooking]);

  const toggleOnline = async () => {
    try {
      const res = await fetch("/api/driver/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isOnline: !isOnline })
      });
      if (res.ok) setIsOnline(!isOnline);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      const res = await fetch("/api/driver/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId: id })
      });
      if (res.ok) {
         setRequests([]);
         const data = await res.json();
         setCurrentBooking(data.booking);
      } else {
         alert(t("login_failed"));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const res = await fetch("/api/driver/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId: id })
      });
      if (res.ok) {
         setCurrentBooking(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const logout = () => {
    localStorage.removeItem("cng_driver_token");
    router.push("/driver/login");
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Premium Background Decoration */}
      <div className="fixed inset-0 bg-gradient-to-b from-emerald-600/10 via-transparent to-transparent pointer-events-none" />

      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-6 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 flex items-center justify-between shadow-sm min-h-[5rem]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <User className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-800 uppercase tracking-tighter leading-none">{t("driver_portal")}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {token.slice(-6).toUpperCase()}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="rounded-full hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <main className="relative z-10 p-6 w-full max-w-md flex flex-col gap-6 flex-1">
        {!isApproved ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-700">
             <div className="w-24 h-24 bg-amber-100 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-amber-200/50">
               <Info className="w-10 h-10 text-amber-600 animate-pulse" />
             </div>
             <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-3">
               {t("verification_pending")}
             </h2>
             <p className="text-slate-500 font-bold uppercase tracking-widest text-xs opacity-60 leading-relaxed max-w-[200px] mx-auto">
               {t("pending_desc")}
             </p>
             <div className="mt-12 p-6 bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-100 w-full">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t("welcome_driver")}</p>
                <div className="h-1 w-12 bg-emerald-500 mx-auto rounded-full mb-4" />
                <p className="text-sm font-bold text-slate-600">{t("approval_call")}</p>
             </div>
          </div>
        ) : (
          <>
        {/* Status Card */}
        {!currentBooking && (
          <Card className="relative overflow-hidden border-none bg-white/90 backdrop-blur-xl shadow-2xl shadow-slate-200/50 rounded-[2rem]">
            <CardContent className="p-8 flex flex-col items-center w-full">
              <div className={`absolute top-0 left-0 w-full h-1 ${isOnline ? "bg-emerald-500" : "bg-slate-200"}`} />
              
              <div className="mb-8 mt-2 text-center w-full">
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight flex items-center justify-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${isOnline ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)] animate-pulse" : "bg-slate-300"}`} />
                  {isOnline ? t("online") : t("offline")}
                </h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2 flex items-center justify-center gap-2 opacity-80">
                  {isOnline ? (
                    <>
                      <span className="w-3 h-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                      {t("finding")}
                    </>
                  ) : (
                    t("go_online")
                  )}
                </p>
              </div>

              <Button
                onClick={toggleOnline}
                size="lg"
                className={`w-full h-16 text-lg font-black rounded-2xl transition-all duration-500 shadow-xl relative overflow-hidden group ${
                  isOnline 
                  ? "bg-slate-800 hover:bg-slate-900 shadow-slate-800/20 text-white" 
                  : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30 text-white"
                }`}
              >
                <Power className={`w-6 h-6 mr-2 transition-transform duration-500 ${isOnline ? "rotate-180" : "rotate-0 text-emerald-100"}`} />
                {isOnline ? t("go_offline") : t("go_online")}
              </Button>
            </CardContent>
          </Card>
        )}
        </>
        )}

        {/* Ongoing Ride - Prominent & Distinct */}
        {currentBooking && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                {t("ongoing")}
              </h3>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-black text-[10px] px-3">LIVE</Badge>
            </div>
            
            <Card className="border-none shadow-2xl shadow-blue-500/10 rounded-[2rem] bg-white overflow-hidden">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Locations */}
                  <div className="relative space-y-6 before:absolute before:left-3 before:top-4 before:bottom-4 before:w-px before:bg-slate-100">
                    <div className="flex gap-4 relative">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 z-10">
                        <Navigation className="text-emerald-600 w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{t("pickup")}</p>
                        <p className="text-sm font-bold text-slate-800 truncate">{currentBooking.pickupAddress || `${currentBooking.pickupLat.toFixed(4)}, ${currentBooking.pickupLng.toFixed(4)}`}</p>
                        <a 
                          target="_blank" 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${currentBooking.pickupLat},${currentBooking.pickupLng}`}
                          className="inline-flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase mt-2 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <ExternalLink size={10} /> {t("nav_pickup")}
                        </a>
                      </div>
                    </div>

                    <div className="flex gap-4 relative">
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 z-10">
                        <MapPin className="text-red-600 w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{t("drop")}</p>
                        <p className="text-sm font-bold text-slate-800 truncate">{currentBooking.destAddress || `${currentBooking.destLat.toFixed(4)}, ${currentBooking.destLng.toFixed(4)}`}</p>
                        <a 
                          target="_blank" 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${currentBooking.destLat},${currentBooking.destLng}`}
                          className="inline-flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase mt-2 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <ExternalLink size={10} /> {t("nav_drop")}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Fare Section */}
                  <div className="bg-slate-50 p-5 rounded-2xl flex justify-between items-center border border-slate-100">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                        <Banknote size={12} /> {t("to_collect")}
                      </p>
                      <p className="text-3xl font-black text-slate-800">{t("currency")}{currentBooking.fare}</p>
                    </div>
                    <Badge variant="outline" className="h-8 border-slate-200 text-slate-500 font-black text-[10px] uppercase px-3">{t("cash")}</Badge>
                  </div>

                  <Button 
                    onClick={() => handleComplete(currentBooking.id)} 
                    size="lg" 
                    className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-emerald-600/20"
                  >
                    <CheckCircle2 size={24} className="mr-2" /> {t("finish")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Incoming Requests */}
        {isOnline && !currentBooking && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Navigation size={18} className="text-emerald-500" />
                {t("incoming")}
              </h3>
              <Badge className="bg-emerald-600 text-white font-black text-xs h-6 w-6 flex items-center justify-center p-0 rounded-full">{requests.length}</Badge>
            </div>

            <div className="space-y-4">
              {requests.map((req, idx) => (
                <Card 
                  key={req.id} 
                  className="group border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-white overflow-hidden animate-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-50">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{t("fixed_fare")}</p>
                        <p className="text-4xl font-black text-emerald-600 tracking-tighter">{t("currency")}{req.fare}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{t("distance")}</p>
                        <p className="text-xl font-black text-slate-700">{req.distance} <span className="text-xs text-slate-400">{t("km_unit")}</span></p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 mb-6">
                      <div className="flex items-center gap-2 text-slate-600">
                         <MapPin size={12} className="text-emerald-500" />
                         <span className="text-xs font-bold truncate">{req.pickupAddress || t("pickup")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                         <div className="w-[12px] flex justify-center"><Navigation size={10} className="text-red-400" /></div>
                         <span className="text-xs font-bold truncate">{req.destAddress || t("drop")}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        onClick={() => setRequests(prev => prev.filter(r => r.id !== req.id))} 
                        variant="outline" 
                        className="h-14 rounded-2xl border-slate-200 font-black text-xs uppercase hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
                      >
                        <XCircle size={18} className="mr-2" /> {t("reject")}
                      </Button>
                      <Button 
                        onClick={() => handleAccept(req.id)} 
                        className="h-14 rounded-2xl font-black text-xs uppercase shadow-lg shadow-emerald-600/10"
                      >
                        <CheckCircle2 size={18} className="mr-2" /> {t("accept")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {requests.length === 0 && (
                <div className="py-20 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Info className="w-8 h-8 text-slate-300 animate-pulse" />
                  </div>
                  <h4 className="font-black text-slate-400 uppercase tracking-widest text-sm">{t("no_bookings")}</h4>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1 italic">{t("wait_requests")}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
