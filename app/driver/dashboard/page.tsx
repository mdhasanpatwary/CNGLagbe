"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Power, MapPin, Navigation, Info, ExternalLink, CheckCircle2, XCircle, Banknote, Clock, AlertTriangle, Phone, Star, TrendingUp, Award, History, ChevronRight } from "lucide-react";
import Link from "next/link";
import { AppButton } from "@/components/ui/AppButton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/hooks/useLang";
import { supabase } from "@/lib/supabase";
import { CancelModal } from "@/components/CancelModal";
import { Header } from "@/components/layout/Header";
import { apiFetch } from "@/utils/api";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { GoogleMapPreview } from "@/components/GoogleMapPreview";
import { simplifyAddress } from "@/utils/address";
import { Booking } from "@/lib/types/booking";
import { DriverSyncData } from "@/lib/types/driver";
import { PageHeading } from "@/components/ui/PageHeading";

// Internal types for location tracking
interface DriverLocationPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

interface PendingLocationUpdate {
  location: DriverLocationPoint;
  reason: "initial" | "interval" | "movement" | "resume";
}

const LOCATION_INTERVAL_MS = 30_000;
const LOCATION_SEND_THROTTLE_MS = 5_000;
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



const geoOptions: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 5000,
};

export default function DriverHomePage() {
  const router = useRouter();
  const { t } = useLang();
  const [isOnlineOverride, setIsOnlineOverride] = useState<boolean | null>(null);
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(300);
  const [showCancel, setShowCancel] = useState(false);
  const [isArrivedOptimistic, setIsArrivedOptimistic] = useState(false);
  const [locationIssue, setLocationIssue] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const consecutiveFailures = useRef(0);

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
      if (res.ok) {
        // Invalidate sync data to ensure server state is reflected
        queryClient.invalidateQueries({ queryKey: ["driverSync"] });
      } else {
        setIsOnlineOverride(null); // Revert on failure
      }
    } catch (e) {
      console.error(e);
      setIsOnlineOverride(null);
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
      toast.info(t("booking_cancelled") as string);
    } catch (e) {
      console.error(e);
      toast.error(t("error") as string);
    }
  }, [t]);

  const handleAccept = useCallback(async (req: Booking) => {
    try {
      const res = await apiFetch("/api/driver/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: req.id })
      });
      if (res.ok) {
         setRejectedIds(new Set());
         queryClient.invalidateQueries({ queryKey: ["driverSync"] });
         toast.success(t("driver_assigned") as string);
      } else {
         toast.error(t("error") as string);
      }
    } catch (e) {
      console.error(e);
      toast.error(t("error") as string);
    }
  }, [t, queryClient]);



  // ─── React Query for Unified Sync ─────────────────────────────────────────
  const { data: syncData, isLoading: isInitialLoading } = useQuery<DriverSyncData>({
    queryKey: ["driverSync"], // Removed isOnlineOverride from key to prevent full unmount/reset on toggle
    queryFn: async () => {
      const res = await apiFetch("/api/sync");
      if (res.status === 401) {
        router.push("/login");
        throw new Error("Unauthorized");
      }
      return res.json();
    },
    // Only poll if online and NOT in an active booking
    refetchInterval: (query) => {
      const data = query.state.data;
      const isOnline = isOnlineOverride ?? data?.driver?.isOnline ?? false;
      const hasActiveBooking = !!data?.currentBooking;
      
      // Stop polling during active booking to save data/battery. 
      // We'll use Realtime for status changes instead.
      return isOnline && !hasActiveBooking ? 5000 : false;
    },
    staleTime: 5000,
    placeholderData: keepPreviousData, // Keep old data while refetching new status
  });

  const isOnline = isOnlineOverride ?? syncData?.driver?.isOnline ?? false;
  const loading = !syncData && isInitialLoading;

  const driver = syncData?.driver;
  const isApproved = driver?.isApproved ?? true;
  const stats = syncData?.stats || { 
    todayEarnings: 0, 
    todayBookings: 0,
    totalEarnings: 0,
    totalBookings: 0,
    totalRatings: 0,
    avgRating: 0
  };
  const currentBooking = syncData?.currentBooking || null;
  
  // Derive arrivedBooking from currentBooking status + optimistic state
  const arrivedBooking = useMemo(() => {
    if (isArrivedOptimistic && currentBooking) {
      return {
        id: currentBooking.id,
        fare: currentBooking.fare,
        baseFare: currentBooking.baseFare,
        platformFee: currentBooking.platformFee,
        totalFare: currentBooking.totalFare,
        distance: currentBooking.distance
      };
    }
    if (currentBooking?.status === "PICKED_UP") {
      return {
        id: currentBooking.id,
        fare: currentBooking.fare,
        baseFare: currentBooking.baseFare,
        platformFee: currentBooking.platformFee,
        totalFare: currentBooking.totalFare,
        distance: currentBooking.distance
      };
    }
    return null;
  }, [currentBooking, isArrivedOptimistic]);

  // Sync optimistic state: if server reports PICKED_UP or booking is gone, we don't need optimistic anymore
  useEffect(() => {
    if (currentBooking?.status === "PICKED_UP" || !currentBooking) {
      if (isArrivedOptimistic) {
        // Defer to next tick to satisfy strict linting against synchronous state updates in effects
        queueMicrotask(() => {
          setIsArrivedOptimistic(false);
        });
      }
    }
  }, [currentBooking?.status, currentBooking, isArrivedOptimistic]);

  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  // Realtime Status Listener for Active Booking
  useEffect(() => {
    if (!currentBooking?.id) return;

    const channel = supabase.channel(`booking-${currentBooking.id}`)
      .on("broadcast", { event: "status_change" }, (payload) => {
        const { status } = payload.payload;
        // If passenger cancels, we need to refresh the dashboard
        if (status === "CANCELLED") {
          setIsOnlineOverride(null); // Reset override to pick up database 'true' state
          queryClient.invalidateQueries({ queryKey: ["driverSync"] });
          toast.info(t("booking_cancelled") as string);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentBooking?.id, queryClient, t]);

  const handleArrived = useCallback(async (id: string) => {
    try {
      const res = await apiFetch("/api/driver/arrived", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: id })
      });
      if (res.ok) {
         setIsArrivedOptimistic(true);
         queryClient.invalidateQueries({ queryKey: ["driverSync"] });
      }
    } catch (e) {
      console.error(e);
    }
  }, [queryClient]);

  const finishTrip = useCallback(async () => {
    if (!arrivedBooking) return;
    try {
      const res = await apiFetch("/api/driver/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: arrivedBooking.id })
      });
      if (res.ok) {
        setIsArrivedOptimistic(false);
        setIsOnlineOverride(null); // Reset override to pick up database 'true' state
        queryClient.invalidateQueries({ queryKey: ["driverSync"] });
        toast.success(t("completed") as string);
      } else {
        toast.error(t("error") as string);
      }
    } catch (e) {
      console.error(e);
      toast.error(t("error") as string);
    }
  }, [arrivedBooking, queryClient, t]);
  
  const requests = useMemo(() => {
    return (syncData?.requests || []).filter((r: Booking) => !rejectedIds.has(r.id));
  }, [syncData?.requests, rejectedIds]);



  useEffect(() => {
    // Listen for forced offline event from CancelModal
    const handleForcedOffline = () => {
      setIsOnlineOverride(false);
      toast.warning(t("cancel_driver_warning") as string, {
        duration: 5000,
      });
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

    consecutiveFailures.current = 0;
    setLocationIssue(false);

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
    if (err.code === 3 || err.code === 2) {
      consecutiveFailures.current += 1;
      if (consecutiveFailures.current >= 3) {
        setLocationIssue(true);
      }
      return; // Silently retry/ignore on timeout or unavailable
    }
    console.error("Geolocation Error:", { code: err.code, message: err.message });

    if (err.code === err.PERMISSION_DENIED) {
      setShowLocationModal(true);
      setIsOnlineOverride(false);
      apiFetch("/api/driver/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: false })
      }).catch(console.error);
    }
  }, []);

  const requestCurrentLocation = useCallback((reason: PendingLocationUpdate["reason"]) => {
    if (!navigator.geolocation || document.visibilityState === "hidden") return;

    navigator.geolocation.getCurrentPosition((pos) => {
      void sendLocationUpdate({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        timestamp: pos.timestamp || Date.now(),
      }, reason);
    }, handleLocationError, geoOptions);
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
      }, handleLocationError, geoOptions);
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
  const lastActiveReqId = useRef<string | null>(null);

  useEffect(() => {
    const activeReq = requests[0];
    const activeReqId = activeReq?.id;
    
    if (!isOnline || !activeReqId || currentBooking) {
      lastActiveReqId.current = null;
      return;
    }

    // Only reset timer and play sound if it's a NEW request
    if (activeReqId !== lastActiveReqId.current) {
      lastActiveReqId.current = activeReqId;
      
      // Calculate how much time is actually left based on createdAt
      // This is better than just 300 to keep sync with backend
      const createdAt = new Date(activeReq.createdAt).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - createdAt) / 1000);
      const initialTimeLeft = Math.max(0, 300 - elapsedSeconds);
      
      setTimeLeft(initialTimeLeft);

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
    }
    
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
      clearInterval(interval);
    };
  }, [requests, isOnline, currentBooking, handleReject]);

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Premium Background Decoration */}
      <div className="fixed inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />

      <Header 
        role="driver" 
        user={driver} 
        onLogout={logout} 
      />

      <main className="relative p-6 w-full max-w-md flex flex-col gap-6 flex-1">
        <PageHeading 
          title={t("driver_dashboard") as string} 
          subtitle={t("driver_portal") as string}
          className="mb-6"
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 animate-in fade-in duration-500">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t("loading")}</p>
          </div>
        ) : !isApproved ? (
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
                <div className="h-1 w-12 bg-primary mx-auto rounded-full mb-4" />
                <p className="text-sm font-bold text-slate-600">{t("approval_call")}</p>
             </div>
          </div>
        ) : (
          <>
        {locationIssue && isOnline && (
          <div className="bg-amber-500/10 backdrop-blur-sm border border-amber-500/30 text-amber-700 text-xs font-bold px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{t("loc_paused")}</span>
          </div>
        )}

        {/* Status & Stats Card */}
        {!currentBooking && isApproved && (
          <div className="flex flex-col gap-4">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-none bg-white/90 backdrop-blur-xl shadow-lg shadow-slate-200/40 rounded-2xl overflow-hidden">
                <CardContent className="p-3 flex flex-col items-center text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1">{t("today_trips")}</p>
                  <p className="text-xl font-black text-primary">{stats.todayBookings}</p>
                </CardContent>
              </Card>
              <Card className="border-none bg-white/90 backdrop-blur-xl shadow-lg shadow-slate-200/40 rounded-2xl overflow-hidden">
                <CardContent className="p-3 flex flex-col items-center text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1">{t("today_cash")}</p>
                  <p className="text-xl font-black text-slate-800">{t("currency")}{stats.todayEarnings}</p>
                </CardContent>
              </Card>
              <Card 
                className="border-none bg-white/90 backdrop-blur-xl shadow-lg shadow-slate-200/40 rounded-2xl overflow-hidden cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => window.location.href = "/driver/wallet"}
              >
                <CardContent className="p-3 flex flex-col items-center text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1">{t("wallet_balance")}</p>
                  <p className={`text-xl font-black ${(driver?.wallet?.balance || 0) < 0 ? "text-red-500" : "text-slate-800"}`}>
                    {t("currency")}{driver?.wallet?.balance || 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="relative overflow-hidden border-none bg-white/90 backdrop-blur-xl shadow-2xl shadow-slate-200/50 rounded-[2rem]">
              <CardContent className="p-8 flex flex-col items-center w-full">
                <div className={`absolute top-0 left-0 w-full h-1 ${isOnline ? "bg-primary" : "bg-slate-200"}`} />
                
                <div className="mb-6 mt-2 text-center w-full">
                  <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight flex items-center justify-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${isOnline ? "bg-primary shadow-[0_0_12px_rgba(22,163,74,0.9)] animate-pulse" : "bg-slate-300"}`} />
                    {isOnline ? t("online") : t("offline")}
                  </h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2 flex items-center justify-center gap-2 opacity-80">
                    {isOnline ? (
                      <>
                        <span className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
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
                    : "bg-primary hover:bg-primary/90 shadow-primary/30 text-white"
                  }`}
                  leftIcon={<Power className={`w-8 h-8 transition-transform duration-500 ${isOnline ? "rotate-180" : "rotate-0 text-primary-light"}`} />}
                >
                  {isOnline ? t("go_offline") : t("go_online")}
                </AppButton>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <div className="flex flex-col gap-3 mt-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t("performance")}</h3>
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-none bg-white/90 backdrop-blur-xl shadow-lg shadow-slate-200/40 rounded-2xl overflow-hidden">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{t("lifetime_earnings")}</p>
                      <p className="text-lg font-black text-slate-800 leading-tight">{t("currency")}{stats.totalEarnings}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none bg-white/90 backdrop-blur-xl shadow-lg shadow-slate-200/40 rounded-2xl overflow-hidden">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{t("lifetime_trips")}</p>
                      <p className="text-lg font-black text-slate-800 leading-tight">{stats.totalBookings}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none bg-white/90 backdrop-blur-xl shadow-lg shadow-slate-200/40 rounded-2xl overflow-hidden">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{t("rating_score")}</p>
                      <p className="text-lg font-black text-slate-800 leading-tight">
                        {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none bg-white/90 backdrop-blur-xl shadow-lg shadow-slate-200/40 rounded-2xl overflow-hidden">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                      <Info className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{t("total_ratings")}</p>
                      <p className="text-lg font-black text-slate-800 leading-tight">{stats.totalRatings}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* History Link */}
            <Link href="/driver/history">
              <Card className="border-none bg-white/90 backdrop-blur-xl shadow-lg shadow-slate-200/40 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform cursor-pointer hover:bg-slate-50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <History className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{t("full_history")}</p>
                      <p className="text-sm font-black text-slate-800">{t("view_trips_reviews")}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </CardContent>
              </Card>
            </Link>
          </div>
        )}
        </>
        )}

        {/* Ongoing Booking - Prominent & Distinct */}
        {currentBooking && currentBooking.status === "ACCEPTED" && (
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
                  <div className="w-full h-48 rounded-2xl overflow-hidden shadow-inner bg-slate-100 mb-2">
                    <GoogleMapPreview 
                      pickupLat={currentBooking.pickupLat}
                      pickupLng={currentBooking.pickupLng}
                      destLat={currentBooking.destLat}
                      destLng={currentBooking.destLng}
                      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
                    />
                  </div>
                  <div className="px-1 flex justify-end">
                    <a 
                      target="_blank" 
                      href={`https://www.google.com/maps/dir/?api=1&origin=${currentBooking.pickupLat},${currentBooking.pickupLng}&destination=${currentBooking.destLat},${currentBooking.destLng}&travelmode=driving`}
                      className="inline-flex items-center gap-2 text-primary text-[10px] font-black uppercase bg-primary/5 px-4 py-2 rounded-full hover:bg-primary/10 transition-all border border-primary/10"
                    >
                      <Navigation size={12} /> {t("nav_google_maps")}
                    </a>
                  </div>
                  {/* Locations */}
                  <div className="relative space-y-6 before:absolute before:left-3 before:top-4 before:bottom-4 before:w-px before:bg-slate-100">
                    <div className="flex gap-4 relative">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 z-10">
                        <Navigation className="text-primary w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{t("pickup")}</p>
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {simplifyAddress(currentBooking.pickupAddress) || t("pickup")}
                        </p>
                        <p className="text-[10px] text-slate-400 mb-1 truncate">
                          {`${currentBooking.pickupLat.toFixed(4)}, ${currentBooking.pickupLng.toFixed(4)}`}
                        </p>
                        <a 
                          target="_blank" 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${currentBooking.pickupLat},${currentBooking.pickupLng}`}
                          className="inline-flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase mt-1 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
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
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {simplifyAddress(currentBooking.destAddress) || t("drop")}
                        </p>
                        <p className="text-[10px] text-slate-400 mb-1 truncate">
                          {`${currentBooking.destLat.toFixed(4)}, ${currentBooking.destLng.toFixed(4)}`}
                        </p>
                        <a 
                          target="_blank" 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${currentBooking.destLat},${currentBooking.destLng}`}
                          className="inline-flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase mt-1 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <ExternalLink size={10} /> {t("nav_drop")}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Fare Section */}
                  <div className="bg-slate-50 p-5 rounded-2xl space-y-3 border border-slate-100">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                          <Banknote size={12} /> {t("collect_cash")}
                        </p>
                        <p className="text-3xl font-black text-slate-800">{t("currency")}{currentBooking.totalFare || currentBooking.fare}</p>
                      </div>
                      <Badge variant="outline" className="h-8 border-primary/20 text-primary font-black text-[10px] uppercase px-3 bg-primary/5">{t("cash_only")}</Badge>
                    </div>
                    
                    <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                        <span>{t("fare")}</span>
                        <span>{t("currency")}{currentBooking.baseFare || currentBooking.fare}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                        <span>{t("platform_fee")}</span>
                        <span>{t("currency")}{currentBooking.platformFee || 0}</span>
                      </div>
                    </div>
                  </div>

                  {currentBooking.user?.phone && (
                    <AppButton
                      onClick={() => window.location.href = `tel:${currentBooking.user?.phone}`}
                      variant="outline"
                      className="w-full h-16 text-lg font-black rounded-2xl border-slate-200 hover:bg-slate-50 text-slate-800"
                      leftIcon={<Phone size={24} className="text-primary" />}
                    >
                      {t("call_user")} {currentBooking.user?.name ? `- ${currentBooking.user.name}` : ""}
                    </AppButton>
                  )}

                  <AppButton 
                    onClick={() => handleArrived(currentBooking.id)} 
                    className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-white"
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

        {/* Location Permission Modal */}
        {showLocationModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
            <Card className="w-full max-w-sm border-none shadow-2xl rounded-[2rem] bg-white overflow-hidden animate-in zoom-in-95 duration-500">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-inner shadow-red-200">
                  <MapPin className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">{t("loc_req_title")}</h2>
                <p className="text-sm font-medium text-slate-500 mb-8">
                  {t("loc_req_desc")}
                </p>
                
                <AppButton 
                  onClick={() => setShowLocationModal(false)} 
                  className="w-full h-14 text-sm font-black rounded-2xl bg-slate-800 hover:bg-slate-900 text-white uppercase tracking-widest"
                >
                  {t("i_understand")}
                </AppButton>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Arrived Booking Modal - Fare to Collect */}
        {arrivedBooking && (
          <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <Card className="w-full max-w-sm border-none shadow-2xl rounded-[2rem] bg-white overflow-hidden animate-in zoom-in-95 duration-500">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-inner shadow-primary/20">
                  <Clock className="w-10 h-10 text-primary animate-pulse" />
                </div>
                <Badge className="mb-4 bg-primary/10 text-primary border-none font-black text-[10px] px-3 py-1 uppercase tracking-widest">
                  {t("trip_active")}
                </Badge>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">{t("trip_in_progress")}</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 leading-relaxed max-w-[250px]">
                  {t("trip_desc")}
                </p>
                
                <div className="bg-slate-50 p-6 rounded-2xl w-full mb-8 border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none" />
                  <div className="flex justify-center items-center gap-2 mb-4 relative z-10 border-b border-primary/10 pb-4">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{t("distance")}</span>
                    <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 px-2 font-black">{arrivedBooking.distance} {t("km_unit")}</Badge>
                  </div>
                  
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                      <span>{t("fare")}</span>
                      <span>{t("currency")}{arrivedBooking.baseFare || arrivedBooking.fare}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                      <span>{t("platform_fee")}</span>
                      <span>{t("currency")}{arrivedBooking.platformFee || 0}</span>
                    </div>
                    <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t("collect_cash")}</p>
                      <p className="text-4xl font-black text-slate-800">{t("currency")}{arrivedBooking.totalFare || arrivedBooking.fare}</p>
                    </div>
                  </div>
                </div>
                
                <AppButton 
                  onClick={finishTrip} 
                  className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-white"
                  leftIcon={<CheckCircle2 size={24} />}
                >
                  {t("finish_trip_go_online")}
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
                    <span className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(22,163,74,0.5)]" />
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
                      <p className="text-5xl font-black text-primary tracking-tighter">{t("currency")}{req.totalFare || req.fare}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[9px] font-bold text-slate-400">{t("fare")}: {t("currency")}{req.baseFare || req.fare}</span>
                        <span className="text-[9px] font-bold text-slate-400">+ {t("platform_fee")}: {t("currency")}{req.platformFee || 0}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{t("distance")}</p>
                      <p className="text-2xl font-black text-slate-700">{req.distance} <span className="text-sm text-slate-400 opacity-60">{t("km_unit")}</span></p>
                    </div>
                  </div>
                  


                  <div className="w-full h-56 rounded-3xl overflow-hidden shadow-inner bg-slate-100 mb-4 border border-slate-100">
                    <GoogleMapPreview 
                      pickupLat={req.pickupLat}
                      pickupLng={req.pickupLng}
                      destLat={req.destLat}
                      destLng={req.destLng}
                      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
                    />
                  </div>
                  <div className="flex justify-end mb-4">
                    <a 
                      target="_blank" 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${req.pickupLat},${req.pickupLng}&travelmode=driving`}
                      className="inline-flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-all border border-blue-100"
                    >
                      <Navigation size={12} /> {t("nav_google_maps")}
                    </a>
                  </div>
                  
                  <div className="flex flex-col gap-4 mb-8 bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
                    <div className="flex gap-4 text-slate-600 items-start">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t("pickup")}</p>
                          <span className="text-sm font-bold text-slate-800 leading-tight block">
                            {simplifyAddress(req.pickupAddress) || t("pickup")}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {`${req.pickupLat.toFixed(4)}, ${req.pickupLng.toFixed(4)}`}
                          </span>
                        </div>
                    </div>
                    <div className="w-px h-6 bg-slate-200 ml-4 -my-2" />
                    <div className="flex gap-4 text-slate-600 items-start">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Navigation size={16} className="text-red-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t("drop")}</p>
                          <span className="text-sm font-bold text-slate-800 leading-tight block">
                            {simplifyAddress(req.destAddress) || t("drop")}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {`${req.destLat.toFixed(4)}, ${req.destLng.toFixed(4)}`}
                          </span>
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
                      className="h-16 rounded-2xl font-black text-sm uppercase shadow-xl shadow-primary/30 bg-primary hover:bg-primary/90 text-white"
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
