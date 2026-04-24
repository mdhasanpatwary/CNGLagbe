"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Power, User, MapPin, Navigation, Info, ExternalLink, CheckCircle2, XCircle, Banknote, Clock } from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/hooks/useLang";
import { supabase } from "@/lib/supabase";
import { StaticMap } from "@/components/StaticMap";
import { CancelModal } from "@/components/CancelModal";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { apiFetch } from "@/utils/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";



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

interface DriverLocationPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

interface PendingLocationUpdate {
  location: DriverLocationPoint;
  reason: "initial" | "interval" | "movement" | "resume";
}

const LOCATION_INTERVAL_MS = 60_000;
const LOCATION_SEND_THROTTLE_MS = 15_000;
const LOCATION_MOVEMENT_THRESHOLD_METERS = 100;

function getDistanceMeters(a: DriverLocationPoint, b: DriverLocationPoint) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const haversine =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}



export default function DriverDashboard() {
  const router = useRouter();
  const { t } = useLang();
  const [isOnlineOverride, setIsOnlineOverride] = useState<boolean | null>(null);
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(20);
  const [showCancel, setShowCancel] = useState(false);
  const [arrivedBooking, setArrivedBooking] = useState<{ fare: number; distance: number } | null>(null);

  const queryClient = useQueryClient();

  const lastLocation = useRef<{ lat: number; lng: number } | null>(null);
  const locationInterval = useRef<NodeJS.Timeout | null>(null);
  const locationWatch = useRef<number | null>(null);
  const locationFlushTimeout = useRef<NodeJS.Timeout | null>(null);
  const locationRequestInFlight = useRef(false);
  const lastLocationAttemptAt = useRef(0);
  const lastLocationSentAt = useRef(0);
  const pendingLocationUpdate = useRef<PendingLocationUpdate | null>(null);
  const permissionDeniedShown = useRef(false);
  const isOnlineRef = useRef(false);
  const sendLocationUpdateRef = useRef<((location: DriverLocationPoint, reason: PendingLocationUpdate["reason"]) => Promise<void>) | null>(null);
  
  const logout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const toggleOnline = async () => {
    try {
      const nextStatus = !isOnline;
      setIsOnlineOverride(nextStatus);
      const res = await apiFetch("/api/driver/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isOnline: nextStatus })
      });
      if (!res.ok) setIsOnlineOverride(null); // Revert on failure
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = useCallback(async (id: string) => {
    setRejectedIds(prev => new Set(prev).add(id));
    try {
      await apiFetch("/api/driver/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id })
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleAccept = useCallback(async (req: RequestItem) => {
    try {
      const res = await apiFetch("/api/driver/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: req.id })
      });
      if (res.ok) {
         // Clear rejected IDs to start fresh for next search if needed
         setRejectedIds(new Set());
         window.open(`https://www.google.com/maps/dir/?api=1&destination=${req.pickupLat},${req.pickupLng}`, "_blank");
      } else {
         alert(t("error") as string);
      }
    } catch (e) {
      console.error(e);
    }
  }, [t]);



  // ─── React Query for Unified Sync ─────────────────────────────────────────
  const { data: syncData } = useQuery({
    queryKey: ["driverSync", isOnlineOverride],
    queryFn: async () => {
      const res = await apiFetch("/api/sync");
      if (res.status === 401) {
        router.push("/login");
        throw new Error("Unauthorized");
      }
      return res.json();
    },
    refetchInterval: 5000, // Poll every 5s for driver
    staleTime: 5000,
  });

  const isOnline = isOnlineOverride ?? syncData?.driver?.isOnline ?? false;
  const loading = !syncData;

  const driver = syncData?.driver;
  const driverId = driver?.id || "";
  const driverName = driver?.name || "";
  const photoUrl = driver?.photoUrl || "";
  const isApproved = driver?.isApproved ?? true;
  const stats = syncData?.stats || { todayEarnings: 0, todayRides: 0 };
  const currentBooking = syncData?.currentBooking || null;

  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  const handleComplete = useCallback(async (id: string) => {
    try {
      // Capture current fare and distance to show in the "Arrived" modal
      const fare = currentBooking?.fare || 0;
      const distance = currentBooking?.distance || 0;

      const res = await apiFetch("/api/driver/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: id })
      });
      if (res.ok) {
         setArrivedBooking({ fare, distance });
         queryClient.invalidateQueries({ queryKey: ["driverSync"] });
         await apiFetch("/api/driver/status");
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentBooking, queryClient]);
  
  const requests = useMemo(() => {
    return (syncData?.requests || []).filter((r: RequestItem) => !rejectedIds.has(r.id));
  }, [syncData?.requests, rejectedIds]);



  useEffect(() => {
    // Listen for forced offline event from CancelModal
    const handleForcedOffline = () => {
      setIsOnlineOverride(false);
      alert(t("cancel_driver_warning"));
    };
    window.addEventListener("FORCED_OFFLINE", handleForcedOffline);

    return () => {
      window.removeEventListener("FORCED_OFFLINE", handleForcedOffline);
    };
  }, [t]);

  const broadcastLocation = useCallback((location: DriverLocationPoint) => {
    if (!currentBooking) return;

    supabase.channel(`booking-${currentBooking.id}`).send({
      type: "broadcast",
      event: "location",
      payload: { lat: location.lat, lng: location.lng }
    });
  }, [currentBooking]);

  const clearLocationTimers = useCallback(() => {
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
    }

    if (locationWatch.current != null) {
      navigator.geolocation.clearWatch(locationWatch.current);
      locationWatch.current = null;
    }

    if (locationFlushTimeout.current) {
      clearTimeout(locationFlushTimeout.current);
      locationFlushTimeout.current = null;
    }
  }, []);

  const flushPendingLocation = useCallback(() => {
    if (locationFlushTimeout.current) {
      clearTimeout(locationFlushTimeout.current);
      locationFlushTimeout.current = null;
    }

    if (!isOnlineRef.current || document.visibilityState === "hidden") return;

    const pending = pendingLocationUpdate.current;
    const send = sendLocationUpdateRef.current;
    if (!pending || !send) return;

    pendingLocationUpdate.current = null;
    void send(pending.location, pending.reason);
  }, []);

  const queueLocationUpdate = useCallback((update: PendingLocationUpdate) => {
    pendingLocationUpdate.current = update;

    if (locationFlushTimeout.current) return;

    const elapsed = Date.now() - lastLocationAttemptAt.current;
    const delay = Math.max(LOCATION_SEND_THROTTLE_MS - elapsed, 0);

    locationFlushTimeout.current = setTimeout(() => {
      locationFlushTimeout.current = null;
      flushPendingLocation();
    }, delay);
  }, [flushPendingLocation]);

  const sendLocationUpdate = useCallback(async (
    location: DriverLocationPoint,
    reason: PendingLocationUpdate["reason"]
  ) => {
    if (!isOnline || document.visibilityState === "hidden") return;

    const lastSentLocation = lastLocation.current;
    const distanceFromLastSent = lastSentLocation
      ? getDistanceMeters(
          { ...lastSentLocation, timestamp: lastLocationSentAt.current || location.timestamp },
          location
        )
      : Number.POSITIVE_INFINITY;

    if (reason === "movement" && distanceFromLastSent < LOCATION_MOVEMENT_THRESHOLD_METERS) {
      return;
    }

    if (locationRequestInFlight.current) {
      queueLocationUpdate({ location, reason });
      return;
    }

    const now = Date.now();
    const elapsed = now - lastLocationAttemptAt.current;
    if (lastLocationAttemptAt.current > 0 && elapsed < LOCATION_SEND_THROTTLE_MS) {
      queueLocationUpdate({ location, reason });
      return;
    }

    locationRequestInFlight.current = true;
    lastLocationAttemptAt.current = now;

    try {
      const res = await apiFetch("/api/driver/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          source: reason,
          capturedAt: location.timestamp,
        })
      });

      if (!res.ok) {
        throw new Error(`Location update failed with status ${res.status}`);
      }

      lastLocation.current = { lat: location.lat, lng: location.lng };
      lastLocationSentAt.current = Date.now();
      broadcastLocation(location);
    } catch (e) {
      console.error("Location Push Error:", e);
    } finally {
      locationRequestInFlight.current = false;

      if (pendingLocationUpdate.current) {
        const nextElapsed = Date.now() - lastLocationAttemptAt.current;
        if (nextElapsed >= LOCATION_SEND_THROTTLE_MS) {
          flushPendingLocation();
        } else {
          queueLocationUpdate(pendingLocationUpdate.current);
        }
      }
    }
  }, [broadcastLocation, flushPendingLocation, isOnline, queueLocationUpdate]);

  useEffect(() => {
    sendLocationUpdateRef.current = sendLocationUpdate;
  }, [sendLocationUpdate]);

  const handleLocationError = useCallback((err: GeolocationPositionError) => {
    console.error("Geolocation Error:", { code: err.code, message: err.message });

    if (err.code === err.PERMISSION_DENIED && !permissionDeniedShown.current) {
      permissionDeniedShown.current = true;
      alert(t("location_denied") as string);
    }
  }, [t]);

  const requestCurrentLocation = useCallback((reason: PendingLocationUpdate["reason"]) => {
    if (!navigator.geolocation || document.visibilityState === "hidden") return;

    navigator.geolocation.getCurrentPosition((pos) => {
      void sendLocationUpdate({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        timestamp: pos.timestamp || Date.now(),
      }, reason);
    }, handleLocationError, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: reason === "interval" ? 30000 : 10000,
    });
  }, [handleLocationError, sendLocationUpdate]);

  // ─── Real-time Location Push ──────────────────────────────────────────────
  useEffect(() => {
    if (!isOnline) {
      clearLocationTimers();
      pendingLocationUpdate.current = null;
      locationRequestInFlight.current = false;
      lastLocationAttemptAt.current = 0;
      lastLocation.current = null;
      lastLocationSentAt.current = 0;
      permissionDeniedShown.current = false;
      return;
    }

    if (!navigator.geolocation) return;

    const startTracking = () => {
      clearLocationTimers();

      if (document.visibilityState === "hidden") return;

      requestCurrentLocation(lastLocationSentAt.current === 0 ? "initial" : "resume");

      locationInterval.current = setInterval(() => {
        requestCurrentLocation("interval");
      }, LOCATION_INTERVAL_MS);

      locationWatch.current = navigator.geolocation.watchPosition((pos) => {
        void sendLocationUpdate({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: pos.timestamp || Date.now(),
        }, "movement");
      }, handleLocationError, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 15000,
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        clearLocationTimers();
        return;
      }

      if (isOnline) {
        startTracking();
      }
    };

    startTracking();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearLocationTimers();
    };
  }, [clearLocationTimers, handleLocationError, isOnline, requestCurrentLocation, sendLocationUpdate]);

  // ─── Request Timer & Sound ────────────────────────────────────────────────
  useEffect(() => {
    const activeReqId = requests[0]?.id;
    if (!isOnline || !activeReqId || currentBooking) return;
    
    const playAlertTone = () => {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const audioCtx = new AudioCtx();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
      } catch (e) {
        console.error(e);
      }
    };
    
    playAlertTone();
    // Use a timeout to avoid synchronous setState inside effect body
    const timerReset = setTimeout(() => setTimeLeft(20), 0);
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleReject(activeReqId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(timerReset);
      clearInterval(interval);
    };
  }, [requests, isOnline, currentBooking, handleReject]);

  if (loading) return null; // Wait for status check

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Premium Background Decoration */}
      <div className="fixed inset-0 bg-gradient-to-b from-emerald-600/10 via-transparent to-transparent pointer-events-none" />

      <header className="w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50 px-6 pt-[calc(env(safe-area-inset-top)+1rem)] pb-5 flex items-center justify-between shadow-2xl shadow-slate-900/5 min-h-[5.5rem]">
        <Link href="/profile" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-600/20 group-hover:scale-105 transition-all overflow-hidden border border-white/10">
            {photoUrl ? (
              <Image src={photoUrl} alt="Profile" width={32} height={32} className="w-full h-full object-cover" />
            ) : (
              <User className="text-white w-4 h-4" />
            )}
          </div>
          <div>
            <h1 className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none group-hover:text-emerald-600 transition-colors">
              {driverName ? driverName.split(" ")[0] : t("driver_portal")}
            </h1>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-60">ID: {driverId.slice(-6).toUpperCase()}</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <AppButton variant="ghost" onClick={logout} className="rounded-full hover:bg-red-50 hover:text-red-600 transition-colors w-12 h-12 p-0">
            <LogOut className="w-5 h-5" />
          </AppButton>
        </div>
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
        {/* Status & Stats Card */}
        {!currentBooking && isApproved && (
          <div className="flex flex-col gap-4">
            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-none bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden">
                <CardContent className="p-5 flex flex-col items-center text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t("today_trips")}</p>
                  <p className="text-3xl font-black text-emerald-600">{stats.todayRides}</p>
                </CardContent>
              </Card>
              <Card className="border-none bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden">
                <CardContent className="p-5 flex flex-col items-center text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t("today_cash")}</p>
                  <p className="text-3xl font-black text-slate-800">{t("currency")}{stats.todayEarnings}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="relative overflow-hidden border-none bg-white/90 backdrop-blur-xl shadow-2xl shadow-slate-200/50 rounded-[2rem]">
              <CardContent className="p-8 flex flex-col items-center w-full">
                <div className={`absolute top-0 left-0 w-full h-1 ${isOnline ? "bg-emerald-500" : "bg-slate-200"}`} />
                
                <div className="mb-6 mt-2 text-center w-full">
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

                <AppButton
                  onClick={toggleOnline}
                  className={`w-full h-20 text-xl font-black rounded-2xl transition-all duration-500 shadow-xl relative overflow-hidden group ${
                    isOnline 
                    ? "bg-slate-800 hover:bg-slate-900 shadow-slate-800/20 text-white" 
                    : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30 text-white"
                  }`}
                  leftIcon={<Power className={`w-8 h-8 transition-transform duration-500 ${isOnline ? "rotate-180" : "rotate-0 text-emerald-100"}`} />}
                >
                  {isOnline ? t("go_offline") : t("go_online")}
                </AppButton>
              </CardContent>
            </Card>
          </div>
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
                        <Banknote size={12} /> {t("collect_cash")}
                      </p>
                      <p className="text-3xl font-black text-slate-800">{t("currency")}{currentBooking.fare}</p>
                    </div>
                    <Badge variant="outline" className="h-8 border-emerald-200 text-emerald-600 font-black text-[10px] uppercase px-3 bg-emerald-50/50">{t("cash_only")}</Badge>
                  </div>

                  <AppButton 
                    onClick={() => handleComplete(currentBooking.id)} 
                    className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-emerald-600/20 bg-emerald-600 hover:bg-emerald-700 text-white"
                    leftIcon={<CheckCircle2 size={24} />}
                  >
                    {t("i_arrived")}
                  </AppButton>

                  <AppButton 
                    variant="ghost"
                    onClick={() => setShowCancel(true)}
                    className="w-full mt-4 h-12 text-red-500 font-black uppercase tracking-widest text-[10px] hover:bg-red-50"
                    leftIcon={<XCircle size={14} />}
                  >
                    {t("cancel_booking")}
                  </AppButton>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showCancel && currentBooking && (
          <CancelModal 
            bookingId={currentBooking.id} 
            role="DRIVER"
            onClose={() => setShowCancel(false)} 
            onSuccess={() => {
              setShowCancel(false);
              queryClient.invalidateQueries({ queryKey: ["driverSync"] });
            }} 
          />
        )}

        {/* Arrived Booking Modal - Fare to Collect */}
        {arrivedBooking && (
          <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <Card className="w-full max-w-sm border-none shadow-2xl rounded-[2rem] bg-white overflow-hidden animate-in zoom-in-95 duration-500">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner shadow-emerald-200">
                  <Banknote className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">{t("booking_done")}</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">{t("collect_cash")}</p>
                
                <div className="bg-slate-50 p-6 rounded-2xl w-full mb-8 border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/50 rounded-bl-full pointer-events-none" />
                  <div className="flex justify-center items-center gap-2 mb-4 relative z-10 border-b border-emerald-100/50 pb-4">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{t("distance")}</span>
                    <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 px-2 font-black">{arrivedBooking.distance} {t("km_unit")}</Badge>
                  </div>
                  <p className="text-5xl font-black text-slate-800 relative z-10">{t("currency")}{arrivedBooking.fare}</p>
                  <div className="flex flex-col items-center gap-1 mt-3 relative z-10">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t("collect_cash")}</p>
                    <Badge variant="outline" className="border-emerald-100 text-[9px] font-bold text-emerald-700 h-auto px-3 py-1 rounded-full bg-emerald-50/30 uppercase tracking-widest">
                      {t("cash_only")}
                    </Badge>
                  </div>
                </div>
                
                <AppButton 
                  onClick={() => setArrivedBooking(null)} 
                  className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600 text-white"
                  leftIcon={<CheckCircle2 size={24} />}
                >
                  {t("finish")}
                </AppButton>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Incoming Request Fullscreen Modal */}
        {isOnline && !currentBooking && requests.length > 0 && !arrivedBooking && (() => {
          const req = requests[0];
          return (
            <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
              <Card className="w-full sm:max-w-md border-none shadow-2xl rounded-t-[2rem] sm:rounded-[2rem] bg-white overflow-hidden animate-in slide-in-from-bottom-full duration-500 max-h-[90vh] flex flex-col">
                <div className="bg-slate-800 p-4 shrink-0 flex justify-between items-center text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <h3 className="text-sm font-black uppercase tracking-widest">{t("incoming")}</h3>
                  </div>
                  <Badge className="bg-slate-700/80 text-white hover:bg-slate-700 border-none font-black flex gap-1.5 px-3 py-1">
                    <Clock size={14} className={timeLeft <= 5 ? "animate-pulse text-red-400" : ""} /> 
                    <span className={timeLeft <= 5 ? "text-red-400" : ""}>{timeLeft}s</span>
                  </Badge>
                </div>
                
                <CardContent className="p-6 flex-1 overflow-y-auto">
                  <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-50">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{t("fixed_fare")}</p>
                      <p className="text-5xl font-black text-emerald-600 tracking-tighter">{t("currency")}{req.fare}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{t("distance")}</p>
                      <p className="text-2xl font-black text-slate-700">{req.distance} <span className="text-sm text-slate-400 opacity-60">{t("km_unit")}</span></p>
                    </div>
                  </div>
                  
                  <div className="mb-6 rounded-2xl overflow-hidden border-2 border-slate-100 relative group">
                    <StaticMap 
                      lat={req.pickupLat} 
                      lng={req.pickupLng} 
                      markers={[{ lat: req.pickupLat, lng: req.pickupLng, color: "blue", label: "P" }]} 
                      height={180} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent pointer-events-none" />
                  </div>

                  <div className="flex flex-col gap-4 mb-8 bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
                    <div className="flex gap-4 text-slate-600 items-start">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin size={16} className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t("pickup")}</p>
                          <span className="text-sm font-bold text-slate-800 leading-tight block">{req.pickupAddress || `${req.pickupLat.toFixed(4)}, ${req.pickupLng.toFixed(4)}`}</span>
                        </div>
                    </div>
                    <div className="w-px h-6 bg-slate-200 ml-4 -my-2" />
                    <div className="flex gap-4 text-slate-600 items-start">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Navigation size={16} className="text-red-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t("drop")}</p>
                          <span className="text-sm font-bold text-slate-800 leading-tight block">{req.destAddress || `${req.destLat.toFixed(4)}, ${req.destLng.toFixed(4)}`}</span>
                        </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <AppButton 
                      onClick={() => handleReject(req.id)} 
                      variant="secondary" 
                      className="h-16 rounded-2xl border-slate-200 font-black text-sm uppercase hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
                      leftIcon={<XCircle size={20} />}
                    >
                      {t("reject")}
                    </AppButton>
                    <AppButton 
                      onClick={() => handleAccept(req)} 
                      className="h-16 rounded-2xl font-black text-sm uppercase shadow-xl shadow-emerald-500/30 bg-emerald-500 hover:bg-emerald-600 text-white"
                      leftIcon={<CheckCircle2 size={20} />}
                    >
                      {t("accept")}
                    </AppButton>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
