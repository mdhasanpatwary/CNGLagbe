"use client";

import { use, useEffect, useRef, useState } from "react";
import {

  CheckCircle2,
  Clock3,
  MapPin,
  Phone,
  Star,
  User as UserIcon,
  XCircle,
  AlertTriangle,
} from "lucide-react";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { type TextKey } from "@/constants/text";
import { BOOKING_REQUEST_TIMEOUT_SECONDS } from "@/constants/booking";
import { saveBookingSession } from "@/utils/bookingSession";
import { COLORS } from "@/constants/colors";
import { CancelModal } from "@/components/CancelModal";
import { AppButton } from "@/components/ui/AppButton";
import { Header } from "@/components/layout/Header";
import { formatDecimal } from "@/lib/utils";
import { CngIcon } from "@/components/icons/CngIcon";

import { PageHeading } from "@/components/ui/PageHeading";
import { apiFetch } from "@/utils/api";
import { useLang } from "@/hooks/useLang";
import { supabase } from "@/lib/supabase";
import { Booking } from "@/lib/types/booking";
import { User } from "@/lib/types/user";
import { getRemainingSeconds, getBookingUiState, formatDuration } from "@/lib/booking-utils";

export default function UserBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useLang();
  const router = useRouter();
  const { id } = use(params);

  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [user, setUser] = useState<User | null>(null);
  const [imgError, setImgError] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const pickupMarker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const driverMarker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  
  const [userRating, setUserRating] = useState<number>(0);
  const [userFeedback, setUserFeedback] = useState<string>("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [isSubmittingOfflineFeedback, setIsSubmittingOfflineFeedback] = useState(false);
  const [offlineFeedbackSubmitted, setOfflineFeedbackSubmitted] = useState(false);
  const [dynamicTimeoutSeconds, setDynamicTimeoutSeconds] = useState(BOOKING_REQUEST_TIMEOUT_SECONDS);

  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const handleSubmitReport = async () => {
    if (!selectedReason) return;
    if (selectedReason === "OTHER" && (!reportDetails || !reportDetails.trim())) {
      return;
    }
    
    setIsSubmittingReport(true);
    try {
      const res = await apiFetch(`/api/booking/${id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: selectedReason,
          details: reportDetails,
        }),
      });
      
      if (res.ok) {
        setReportSubmitted(true);
        void fetchBooking();
      }
    } catch (err) {
      console.error("Submit report error:", err);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiFetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error("User fetch error:", err);
      }
    };
    fetchUser();
  }, []);

  const { data: bookingData, refetch: fetchBooking } = useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      const res = await fetch(`/api/booking/${id}`);
      if (!res.ok) throw new Error(t("error"));
      const data = await res.json();
      if (typeof data.timeoutSeconds === "number") {
        setDynamicTimeoutSeconds(data.timeoutSeconds);
      }
      return data.booking as Booking;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "COMPLETED" || status === "CANCELLED" || status === "TIMED_OUT") {
        return false;
      }
      return 10000;
    },
    staleTime: 5000,
  });

  const booking = bookingData ?? null;
  const isAlreadyReported =
    !!(booking?.issueReports && booking.issueReports.length > 0) || reportSubmitted;
  const countdown =
    booking?.status === "PENDING"
      ? getRemainingSeconds(booking.createdAt, now, dynamicTimeoutSeconds)
      : dynamicTimeoutSeconds;

  // Countdown timer
  useEffect(() => {
    if (!booking) return;
    const isPending = booking.status === "PENDING";
    const isAccepted = booking.status === "ACCEPTED" || booking.status === "PICKED_UP";
    const isArrived = booking.status === "ARRIVED";
    
    // We need 'now' for PENDING countdown and for ACCEPTED/ARRIVED/PICKED_UP cancellation 15m timer
    if (!isPending && !isAccepted && !isArrived) return;

    const timer = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);
      
      if (isPending) {
        const remaining = getRemainingSeconds(booking.createdAt, currentNow, dynamicTimeoutSeconds);
        if (remaining <= 0) void fetchBooking();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [booking, fetchBooking, dynamicTimeoutSeconds]);

  const handleRate = async () => {
    if (userRating === 0) return;
    setIsSubmittingRating(true);
    try {
      const res = await apiFetch(`/api/booking/${id}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating: userRating, feedback: userFeedback }),
      });
      if (res.ok) {
        setRatingSubmitted(true);
        void fetchBooking();
      }
    } catch (err) {
      console.error("Rating error:", err);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleOfflineFeedback = async (feedback: string) => {
    setIsSubmittingOfflineFeedback(true);
    try {
      const res = await apiFetch(`/api/booking/${id}/offline-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
      if (res.ok) {
        setOfflineFeedbackSubmitted(true);
        void fetchBooking();
      }
    } catch (err) {
      console.error("Offline feedback error:", err);
    } finally {
      setIsSubmittingOfflineFeedback(false);
    }
  };

  // Realtime via Supabase
  useEffect(() => {
    if (!booking) return;
    const channel = supabase
      .channel(`booking-${id}`)
      .on("broadcast", { event: "location" }, ({ payload }) => {
        if (booking.status === "ACCEPTED" || booking.status === "ARRIVED") {
          setDriverLocation(payload);
          if (driverMarker.current) driverMarker.current.position = payload;
        }
      })
      .on("broadcast", { event: "status_change" }, () => { void fetchBooking(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [booking, fetchBooking, id]);

  // Map init for DRIVER_ASSIGNED
  useEffect(() => {
    if (!booking || !mapRef.current) return;
    const uiState = getBookingUiState(booking, countdown);
    if (uiState !== "DRIVER_ASSIGNED" && uiState !== "DRIVER_ARRIVED") return;

    let cancelled = false;
    const initMap = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey || !mapRef.current) return;

      if (!window.google?.maps?.importLibrary) {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&v=weekly`;
        script.async = true;
        document.head.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }
      if (cancelled || !mapRef.current) return;

      const { Map } = (await window.google.maps.importLibrary("maps")) as google.maps.MapsLibrary;
      const { AdvancedMarkerElement, PinElement } =
        (await window.google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;

      if (!mapInstance.current) {
        mapInstance.current = new Map(mapRef.current, {
          center: { lat: booking.pickupLat, lng: booking.pickupLng },
          zoom: 15,
          mapId: "DEMO_MAP_ID",
          disableDefaultUI: true,
        });
      }

      if (!pickupMarker.current) {
        pickupMarker.current = new AdvancedMarkerElement({
          map: mapInstance.current,
          position: { lat: booking.pickupLat, lng: booking.pickupLng },
          title: t("pickup"),
          content: new PinElement({ background: COLORS.pickup, borderColor: COLORS.pickupBorder, glyphColor: COLORS.glyph }).element,
        });
      }

      if (driverLocation && !driverMarker.current) {
        driverMarker.current = new AdvancedMarkerElement({
          map: mapInstance.current,
          position: driverLocation,
          title: t("driver"),
          content: new PinElement({ background: COLORS.driver, borderColor: COLORS.driverBorder, glyphColor: COLORS.glyph }).element,
        });
      } else if (driverLocation && driverMarker.current) {
        driverMarker.current.position = driverLocation;
      }
    };

    void initMap();
    return () => { cancelled = true; };
  }, [booking, countdown, driverLocation, t]);

  if (!booking) {
    return (
      <div className="flex h-screen flex-col items-center justify-center premium-bg-surface relative overflow-hidden">
        <div className="absolute inset-0 dot-grid-texture opacity-50 pointer-events-none" />
        <div className="relative flex items-center justify-center mb-6 z-10">
          <div className="absolute w-24 h-24 rounded-full bg-primary/30 pulse-ring" />
          <div className="absolute w-24 h-24 rounded-full bg-primary/20 pulse-ring pulse-ring-delay-1" />
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <CngIcon size={24} className="text-white" />
          </div>
        </div>
        <p className="font-bold text-slate-500 relative z-10">{t("loading")}</p>
      </div>
    );
  }

  const uiState = getBookingUiState(booking, countdown);
  const cancelLabelKey: TextKey = uiState === "FINDING_DRIVER" ? "cancel_request" : "cancel_booking";
  const showCancelAction = uiState === "FINDING_DRIVER" || uiState === "DRIVER_ASSIGNED" || uiState === "DRIVER_ARRIVED";
  const showDriverCard = (uiState === "DRIVER_ASSIGNED" || uiState === "DRIVER_ARRIVED" || uiState === "COMPLETED") && Boolean(booking.driver);


  const progressPct = uiState === "FINDING_DRIVER"
    ? Math.round((countdown / BOOKING_REQUEST_TIMEOUT_SECONDS) * 100)
    : 100;

  // Use arrivedAt if available, fallback to acceptedAt for legacy bookings
  const waitStartTime = booking.arrivedAt || booking.acceptedAt;
  const diffMinutes = waitStartTime
    ? Math.max(0, Math.floor((now - new Date(waitStartTime).getTime()) / (1000 * 60)))
    : 0;
  const canCancelAfterAccept =
    uiState === "FINDING_DRIVER" ||
    (uiState === "DRIVER_ARRIVED" && diffMinutes >= 15) ||
    (uiState === "DRIVER_ASSIGNED" && diffMinutes >= 15);

  const remainingWaitSeconds = waitStartTime
    ? Math.max(0, 15 * 60 - Math.floor((now - new Date(waitStartTime).getTime()) / 1000))
    : 0;

  const timeValue = (() => {
    if (uiState === "FINDING_DRIVER") return `${countdown}s`;
    const startTime = booking.acceptedAt || booking.createdAt;
    const endTime = booking.completedAt || booking.cancelledAt || new Date().toISOString();
    const durationSeconds = Math.max(0, Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000));
    return formatDuration(durationSeconds, t("just_now"));
  })();

  // Status config


  const handleRequestAgain = () => {
    if (!booking) return;

    saveBookingSession({
      pickup: {
        lat: booking.pickupLat,
        lng: booking.pickupLng,
        label: booking.pickupAddress || t("pickup"),
      },
      drop: {
        lat: booking.destLat,
        lng: booking.destLng,
        label: booking.destAddress || t("drop"),
      },
      route: {
        polyline: booking.polyline || "",
        distanceText: `${booking.distance.toFixed(1)} km`,
        durationText: timeValue,
        durationMinutes: null,
        distanceKm: booking.distance,
      },
      fare: booking.fare,
      lastUpdated: Date.now(),
    });

    router.push("/user/map");
  };

  return (
    <div className="flex min-h-screen flex-col premium-bg-surface relative overflow-hidden">
      <div className="absolute inset-0 dot-grid-texture opacity-50 pointer-events-none" />
      <Header
        role="user"
        theme="light"
        user={user}
      />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 pt-12 pb-24 px-4 relative z-10">
        <PageHeading
          title={
            (uiState === "FINDING_DRIVER" || uiState === "DRIVER_ASSIGNED" || uiState === "DRIVER_ARRIVED")
              ? (t("active_booking") as string)
              : (t("booking_details") as string)
          }
          subtitle={t("user_portal") as string}
          className="mb-2"
          backHref="/user/history"
        />

        {/* ── FINDING DRIVER STATE ──────────────────────────────────────── */}
        {uiState === "FINDING_DRIVER" && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">{t("finding_driver")}</span>
                </div>
                <span className="text-[10px] font-black text-slate-400">#{id.slice(-6).toUpperCase()}</span>
              </div>
            </div>

            <div className="p-6">
              {/* Animated visual */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative flex items-center justify-center mb-6">
                  <div className="absolute w-32 h-32 rounded-full bg-primary/20 pulse-ring" />
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-light to-primary-dark shadow-2xl flex items-center justify-center relative z-10">
                    <CngIcon size={32} className="text-white" />
                  </div>

                </div>
                <p className="text-sm font-medium text-slate-500 text-center">{t("search_timeout_help")}</p>
              </div>

              {/* Countdown progress bar */}
              <div className="mb-8">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                  <span>{t("timeout_label")}</span>
                  <span className="text-amber-600 font-black">{countdown}s</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-amber-400 rounded-full transition-all duration-1000"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Ride Summary Integrated */}
              <div className="space-y-6 pt-2">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 mt-1 shrink-0">
                    <MapPin size={14} className="text-primary" />
                    <div className="w-0.5 h-6 bg-slate-100" />
                    <MapPin size={14} className="text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {booking.pickupAddress && !booking.pickupAddress.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/) ? booking.pickupAddress : t("pickup")}
                    </p>
                    <div className="h-4" /> {/* Space between addresses */}
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {booking.destAddress && !booking.destAddress.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/) ? booking.destAddress : t("drop")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100 col-span-1">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t("fare")}</span>
                    <p className="text-[10px] font-bold text-slate-500">{t("fare")}: {t("currency")}{booking.baseFare || booking.fare}</p>
                    <p className="text-[10px] font-bold text-slate-500">{t("platform_fee")}: {t("currency")}{booking.platformFee || 0}</p>
                    <div className="h-[1px] bg-slate-200 my-1" />
                    <p className="text-sm font-black text-slate-900">{t("currency")}{booking.totalFare || booking.fare}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t("time")}</span>
                    <p className="text-sm font-black text-slate-900">{timeValue}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t("distance")}</span>
                    <p className="text-sm font-black text-slate-900">{formatDecimal(booking.distance, 1)}{t("km_unit")}</p>
                  </div>
                </div>
              </div>

              {showCancelAction && (
                <div className="mt-8">
                  <AppButton
                    fullWidth
                    onClick={() => setShowCancel(true)}
                    className="h-14 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 text-sm font-bold border border-red-100"
                    leftIcon={<XCircle size={16} />}
                  >
                    {t(cancelLabelKey)}
                  </AppButton>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── DRIVER ASSIGNED STATE ─────────────────────── */}
        {uiState === "DRIVER_ASSIGNED" && showDriverCard && booking.driver && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            {/* Header Section */}
            <div className="bg-slate-900 px-5 py-4 flex justify-between items-center border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10 shrink-0 shadow-inner">
                  {booking.driver.photoUrl && !imgError ? (
                    <Image
                      src={booking.driver.photoUrl}
                      alt={booking.driver.name}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover object-top"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <UserIcon size={20} className="text-slate-500" />
                  )}
                </div>
                <div className="flex flex-col">
                  <h3 className="text-base font-black text-white truncate leading-tight">{booking.driver.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] font-black bg-primary/20 text-primary-light px-2 py-0.5 rounded uppercase tracking-tighter">
                      {t("top_rated")}
                    </span>
                    {booking.driver.averageRating && (
                      <span className="text-[11px] font-black text-amber-500 flex items-center gap-0.5">
                        <Star size={10} fill="currentColor" />
                        {formatDecimal(booking.driver.averageRating, 1)}
                        {booking.driver.ratingCount !== undefined && booking.driver.ratingCount > 0 && (
                          <span className="text-slate-400 font-bold ml-0.5">({booking.driver.ratingCount})</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {booking.driver.vehicleNumber && (
                <div className="license-plate scale-100">
                  <span className="text-[10px] font-black bg-slate-900 text-white px-1.5 rounded-sm mr-1">CNG</span>
                  {booking.driver.vehicleNumber}
                </div>
              )}
            </div>

            <div className="p-6">
              {/* Driver Arriving Animation */}
              <div className="w-full relative bg-slate-50 rounded-2xl overflow-hidden mb-8 p-5 border border-slate-100">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("status")}</span>
                  <div className="px-3 py-1 bg-white shadow-sm border border-primary/10 rounded-full text-primary text-[10px] font-black animate-pulse flex items-center gap-1.5">
                    <Clock3 size={12} />
                    {t("wait_minutes")}
                  </div>
                </div>

                <div className="w-full h-8 relative">
                  <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 flex items-center">
                    <div className="w-full border-b-2 border-dashed border-slate-200 relative">
                      <div className="absolute top-[-2px] left-0 h-[2px] bg-primary animate-path-fill"></div>
                    </div>
                  </div>
                  <div className="absolute top-1/2 -translate-y-1/2 animate-drive-approach z-10">
                    <div className="relative w-12 h-12">
                      <Image 
                        src="/cng_side.png" 
                        alt="CNG" 
                        fill 
                        sizes="48px"
                        className="object-contain -scale-x-100" 
                        priority 
                      />
                    </div>
                  </div>
                  <div className="absolute top-1/2 -translate-y-1/2 right-4 z-0">
                    <div className="relative flex items-center justify-center w-8 h-8">
                      <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                      <div className="w-8 h-8 bg-white shadow-sm border border-slate-100 flex items-center justify-center rounded-full z-10 relative">
                        <MapPin size={18} className="text-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ride Summary Integrated */}
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 mt-1 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-primary bg-white" />
                    <div className="w-0.5 h-8 bg-slate-100" />
                    <MapPin size={14} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-6">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t("pickup")}</span>
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {booking.pickupAddress && !booking.pickupAddress.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/) ? booking.pickupAddress : t("pickup")}
                      </p>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t("drop")}</span>
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {booking.destAddress && !booking.destAddress.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/) ? booking.destAddress : t("drop")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("fare")}</span>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold text-slate-500 leading-tight">{t("fare")}: {t("currency")}{formatDecimal(booking.baseFare || booking.fare)}</p>
                      <p className="text-[9px] font-bold text-slate-500 leading-tight">{t("platform_fee")}: {t("currency")}{formatDecimal(booking.platformFee || 0)}</p>
                      <p className="text-base font-black text-slate-900">{t("currency")}{formatDecimal(booking.totalFare || booking.fare)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("time")}</span>
                    <p className="text-base font-black text-slate-900">{timeValue}</p>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("distance")}</span>
                    <p className="text-base font-black text-slate-900">{booking.distance.toFixed(1)}{t("km_unit")}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <a
                  href={`tel:${booking.driver.phone}`}
                  className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-primary text-base font-black text-white transition-all shadow-xl shadow-primary/25 hover:bg-primary-dark active:scale-[0.98]"
                >
                  <Phone size={20} fill="currentColor" />
                  {t("call_driver")}
                </a>

                {canCancelAfterAccept && (
                  <AppButton
                    variant="secondary"
                    onClick={() => setShowCancel(true)}
                    className="h-14 rounded-2xl border-2 border-slate-100 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-red-500 hover:border-red-100 hover:bg-red-50/50 transition-all"
                  >
                    {t("cancel_booking")}
                  </AppButton>
                )}

                {!canCancelAfterAccept && uiState === "DRIVER_ASSIGNED" && (
                  <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest mt-2 bg-slate-50 py-3 rounded-xl border border-dashed border-slate-200">
                    {t("cancel_available_in")} {formatDuration(remainingWaitSeconds, "0:00")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── DRIVER ARRIVED STATE ──────────────────────────────────────── */}
        {uiState === "DRIVER_ARRIVED" && showDriverCard && booking.driver && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="bg-amber-500 px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-white" />
                </div>
                <span className="text-sm font-black text-white uppercase tracking-wider">{t("driver_arrived")}</span>
              </div>
              <span className="text-[10px] font-black text-white/70">#{id.slice(-6).toUpperCase()}</span>
            </div>

            <div className="p-6">
              {/* Arrived animation / visual */}
              <div className="w-full relative bg-amber-50 rounded-2xl overflow-hidden mb-8 p-5 border border-amber-100 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-3 shadow-inner shadow-amber-200">
                  <MapPin size={28} className="text-amber-600 fill-amber-600/20" />
                </div>
                <p className="text-sm font-black text-amber-800 uppercase tracking-tight text-center">{t("driver_arrived_info")}</p>
              </div>

              {/* Ride summary */}
              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("fare")}</span>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold text-slate-500 leading-tight">{t("fare")}: {t("currency")}{formatDecimal(booking.baseFare || booking.fare)}</p>
                      <p className="text-[9px] font-bold text-slate-500 leading-tight">{t("platform_fee")}: {t("currency")}{formatDecimal(booking.platformFee || 0)}</p>
                      <p className="text-base font-black text-slate-900">{t("currency")}{formatDecimal(booking.totalFare || booking.fare)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("time")}</span>
                    <p className="text-base font-black text-slate-900">{timeValue}</p>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("distance")}</span>
                    <p className="text-base font-black text-slate-900">{booking.distance.toFixed(1)}{t("km_unit")}</p>
                  </div>
                </div>
              </div>

              {/* Call Driver */}
              <div className="flex flex-col gap-3">
                <a
                  href={`tel:${booking.driver.phone}`}
                  className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-primary text-base font-black text-white transition-all shadow-xl shadow-primary/25 hover:bg-primary-dark active:scale-[0.98]"
                >
                  <Phone size={20} fill="currentColor" />
                  {t("call_driver")}
                </a>

                {canCancelAfterAccept && (
                  <AppButton
                    variant="secondary"
                    onClick={() => setShowCancel(true)}
                    className="h-14 rounded-2xl border-2 border-slate-100 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-red-500 hover:border-red-100 hover:bg-red-50/50 transition-all"
                  >
                    {t("cancel_booking")}
                  </AppButton>
                )}

                {!canCancelAfterAccept && (
                  <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest mt-2 bg-slate-50 py-3 rounded-xl border border-dashed border-slate-200">
                    {t("cancel_available_in")} {formatDuration(remainingWaitSeconds, "0:00")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TRIP IN PROGRESS STATE ─────────────────────────────────────── */}
        {uiState === "TRIP_IN_PROGRESS" && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            {/* Status Header */}
            <div className="bg-primary/10 px-6 py-4 border-b border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CngIcon size={16} className="text-primary-dark" />
                <span className="text-xs font-black text-primary-dark uppercase tracking-wider">{t("trip_active")}</span>
              </div>
              <span className="text-[10px] font-black text-slate-400">#{id.slice(-6).toUpperCase()}</span>
            </div>

            <div className="p-6">
              {/* Visual and Message */}
              <div className="flex flex-col items-center mb-10">
                <div className="w-full max-w-[340px] flex items-center gap-2 mb-8">
                  {/* Pickup Point */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                      <div className="w-3 h-3 rounded-full bg-slate-400 border-2 border-white" />
                    </div>
                    <span className="text-[9px] font-black text-slate-400 mt-1.5 uppercase tracking-tighter">Pickup</span>
                  </div>

                  {/* Flat Animation Area (Center) */}
                  <div className="flex-1 relative h-20 flex flex-col items-center justify-center">
                    <div className="absolute bottom-4 left-0 right-0 h-[4px] animate-road-move opacity-20" />
                    <div className="relative z-10 flex flex-col items-center translate-y-2">

                      <div className="relative w-[50px] h-[50px]">
                        <Image src="/cng_side.png" alt="CNG" fill sizes="50px" className="object-contain -scale-x-100" priority />
                      </div>
                    </div>
                    <div className="absolute bottom-5 left-1/2 -translate-x-6 flex gap-1.5 opacity-20">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-ping" style={{ animationDuration: '0.8s' }} />
                    </div>
                  </div>

                  {/* Destination Point */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 shadow-sm">
                      <MapPin className="w-5 h-5 text-red-600 fill-red-600/10" />
                    </div>
                    <span className="text-[9px] font-black text-red-600 mt-1.5 uppercase tracking-tighter">Drop</span>
                  </div>
                </div>

                <h3 className="text-xl font-black text-slate-900 text-center tracking-tight">{t("trip_in_progress")}</h3>
                <p className="text-sm font-medium text-slate-500 text-center mt-1">{t("safe_journey")}</p>
              </div>

              {/* Ride Summary Integrated */}
              <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("fare")}</span>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-bold text-slate-500 leading-tight">{t("fare")}: {t("currency")}{booking.baseFare || booking.fare}</p>
                    <p className="text-[9px] font-bold text-slate-500 leading-tight">{t("platform_fee")}: {t("currency")}{booking.platformFee || 0}</p>
                    <p className="text-base font-black text-slate-900">{t("currency")}{booking.totalFare || booking.fare}</p>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("time")}</span>
                  <p className="text-base font-black text-slate-900">{timeValue}</p>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("distance")}</span>
                  <p className="text-base font-black text-slate-900">{booking.distance.toFixed(1)}{t("km_unit")}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── COMPLETED STATE ───────────────────────────────────────────── */}
        {uiState === "COMPLETED" && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            {/* Status Header */}
            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">{t("completed")}</span>
              </div>
              <span className="text-[10px] font-black text-slate-400">#{id.slice(-6).toUpperCase()}</span>
            </div>

            <div className="p-6">
              {/* Success Message */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900 text-center">{t("booking_done")}</h3>
                <p className="text-sm font-medium text-slate-500 text-center mt-1">{t("safe_journey")}</p>
              </div>

              {/* Fare Summary */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">{t("total_fare")}</span>
                  <div className="flex flex-col">
                    <p className="text-[11px] font-bold text-slate-500">{t("fare")}: {t("currency")}{booking.baseFare || booking.fare}</p>
                    <p className="text-[11px] font-bold text-slate-500">{t("platform_fee")}: {t("currency")}{booking.platformFee || 0}</p>
                    <div className="h-[1px] bg-slate-200 my-1" />
                    <p className="text-xl font-black text-emerald-600">{t("currency")}{booking.totalFare || booking.fare}</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">{t("distance")}</span>
                  <p className="text-xl font-black text-slate-900">{booking.distance.toFixed(1)}{t("km_unit")}</p>
                </div>
              </div>

              {/* Rating Section */}
              {!booking.rating && !ratingSubmitted ? (
                <div className="mb-8 pt-6 border-t border-slate-50">
                  <h4 className="text-sm font-black text-slate-900 text-center mb-1">{t("rate_driver")}</h4>
                  <p className="text-[11px] font-bold text-slate-400 text-center mb-6 uppercase tracking-wider">{t("rate_desc")}</p>
                  
                  <div className="flex justify-center gap-3 mb-8">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <AppButton
                        variant="ghost"
                        key={star}
                        onClick={() => setUserRating(star)}
                        className="h-auto p-1 transition-all active:scale-90 hover:bg-amber-50"
                      >
                        <Star
                          size={32}
                          fill={userRating >= star ? "#FFB800" : "none"}
                          strokeWidth={2}
                          className={userRating >= star ? "text-amber-400 drop-shadow-[0_0_8px_rgba(255,184,0,0.3)]" : "text-slate-200"}
                        />
                      </AppButton>
                    ))}
                  </div>

                  {userRating > 0 && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <textarea
                        value={userFeedback}
                        onChange={(e) => setUserFeedback(e.target.value)}
                        placeholder={t("feedback_ph")}
                        className="w-full rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[80px] resize-none"
                      />
                      <AppButton
                        fullWidth
                        loading={isSubmittingRating}
                        onClick={handleRate}
                        className="h-14 rounded-2xl bg-slate-900 text-white text-sm font-black shadow-lg shadow-slate-900/10"
                      >
                        {t("submit_rating")}
                      </AppButton>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-8 pt-6 border-t border-slate-50 text-center">
                  <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider">
                    <CheckCircle2 size={14} />
                    {t("rating_submitted")}
                  </div>
                  <div className="flex justify-center gap-1 mt-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        fill={(booking.rating || userRating) >= star ? "#FFB800" : "none"}
                        strokeWidth={2}
                        className={(booking.rating || userRating) >= star ? "text-amber-400" : "text-slate-100"}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <AppButton
                  fullWidth
                  onClick={() => router.push("/user/map")}
                  className="h-14 rounded-2xl bg-primary text-white hover:bg-primary-dark text-base font-black shadow-xl shadow-primary/20"
                  leftIcon={<CngIcon size={18} />}
                >
                  {t("bk_another")}
                </AppButton>

                {booking.driver && (
                  isAlreadyReported ? (
                    <AppButton
                      fullWidth
                      variant="secondary"
                      disabled
                      className="h-14 rounded-2xl bg-red-50/50 text-red-400 border border-red-100/50 font-black uppercase text-sm cursor-not-allowed"
                      leftIcon={<AlertTriangle size={16} />}
                    >
                      {t("reported")}
                    </AppButton>
                  ) : (
                    <AppButton
                      fullWidth
                      variant="secondary"
                      onClick={() => setShowReportModal(true)}
                      className="h-14 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 font-black uppercase text-sm"
                      leftIcon={<AlertTriangle size={16} />}
                    >
                      {t("report_driver")}
                    </AppButton>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── CANCELLED OR TIMED_OUT STATE ────────────────────────────────── */}
        {(uiState === "CANCELLED" || uiState === "TIMED_OUT") && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            {/* Status Header */}
            <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle size={16} className="text-red-500" />
                <span className="text-xs font-black text-red-700 uppercase tracking-wider">
                  {t(booking.status === "TIMED_OUT" || uiState === "TIMED_OUT" ? "no_driver" : "booking_cancelled")}
                </span>
              </div>
              <span className="text-[10px] font-black text-slate-400">#{id.slice(-6).toUpperCase()}</span>
            </div>

            <div className="p-6">
              {/* Message */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <XCircle size={40} className="text-red-400" />
                </div>
                <h3 className="text-xl font-black text-slate-900 text-center">
                  {t(booking.status === "TIMED_OUT" || uiState === "TIMED_OUT" ? "no_driver" : "booking_cancelled")}
                </h3>
                <p className="text-sm font-medium text-slate-500 text-center mt-1">
                  {t(booking.status === "TIMED_OUT" || uiState === "TIMED_OUT" ? "no_driver_desc" : "booking_cancelled_desc")}
                </p>
              </div>

              {/* Fraud Feedback Loop */}
              {booking.isSuspicious && !booking.offlineFeedback && !offlineFeedbackSubmitted && (
                <div className="mb-8 p-6 bg-amber-50 rounded-[2rem] border-2 border-amber-100 animate-in fade-in zoom-in duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                      <AlertTriangle size={20} />
                    </div>
                    <p className="text-sm font-black text-amber-900 leading-tight">
                      {t("did_driver_arrive")}
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <AppButton
                      variant="secondary"
                      className="flex-1 h-12 rounded-xl bg-white border-amber-200 text-amber-700 font-bold"
                      onClick={() => handleOfflineFeedback("DRIVER_ARRIVED_NO")}
                      disabled={isSubmittingOfflineFeedback}
                    >
                      {t("no")}
                    </AppButton>
                    <AppButton
                      variant="primary"
                      className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
                      onClick={() => handleOfflineFeedback("DRIVER_ARRIVED_YES")}
                      disabled={isSubmittingOfflineFeedback}
                    >
                      {t("yes")}
                    </AppButton>
                  </div>
                </div>
              )}

              {offlineFeedbackSubmitted && (
                <div className="mb-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                  <p className="text-sm font-bold text-emerald-700">{t("thanks_feedback")}</p>
                </div>
              )}

              {/* Ride Summary Integrated */}
              <div className="space-y-6 mb-8 pt-6 border-t border-slate-50">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 mt-1 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-primary bg-white" />
                    <div className="w-0.5 h-8 bg-slate-100" />
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-red-400 bg-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t("pickup")}</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{booking.pickupAddress || t("pickup")}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t("drop")}</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{booking.destAddress || t("drop")}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t("total_fare")}</span>
                    <p className="text-base font-black text-slate-900">{t("currency")}{booking.fare}</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t("distance")}</span>
                    <p className="text-base font-black text-slate-900">{booking.distance.toFixed(1)}{t("km_unit")}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <AppButton
                  fullWidth
                  onClick={handleRequestAgain}
                  className="h-14 rounded-2xl bg-primary text-white hover:bg-primary-dark text-base font-black shadow-xl shadow-primary/20"
                  leftIcon={<CngIcon size={18} />}
                >
                  {t("retry_booking")}
                </AppButton>

                {booking.driver && (
                  isAlreadyReported ? (
                    <AppButton
                      fullWidth
                      variant="secondary"
                      disabled
                      className="h-14 rounded-2xl bg-red-50/50 text-red-400 border border-red-100/50 font-black uppercase text-sm cursor-not-allowed"
                      leftIcon={<AlertTriangle size={16} />}
                    >
                      {t("reported")}
                    </AppButton>
                  ) : (
                    <AppButton
                      fullWidth
                      variant="secondary"
                      onClick={() => setShowReportModal(true)}
                      className="h-14 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 font-black uppercase text-sm"
                      leftIcon={<AlertTriangle size={16} />}
                    >
                      {t("report_driver")}
                    </AppButton>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Standalone summary card is now redundant and removed */}




      </main>


      {showCancel && (
        <CancelModal
          bookingId={id}
          role="USER"
          titleKey={cancelLabelKey}
          actionLabelKey={cancelLabelKey}
          onClose={() => setShowCancel(false)}
          onSuccess={() => { setShowCancel(false); void fetchBooking(); }}
        />
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[2rem] border border-slate-100 shadow-2xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
            {!reportSubmitted ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">{t("report_driver")}</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">#{id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6 max-h-[250px] overflow-y-auto pr-1">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">{t("select_reason")}</p>
                  {[
                    { key: "DRIVER_DEMANDED_EXTRA_MONEY", labelKey: "reason_extra_money" },
                    { key: "DRIVER_BEHAVED_POORLY", labelKey: "reason_poor_behavior" },
                    { key: "DRIVER_DID_NOT_ARRIVE", labelKey: "reason_no_arrive" },
                    { key: "LOST_ITEMS_IN_VEHICLE", labelKey: "reason_lost_items" },
                    { key: "OTHER", labelKey: "reason_other" },
                  ].map((option) => (
                    <AppButton
                      key={option.key}
                      variant="ghost"
                      onClick={() => setSelectedReason(option.key)}
                      className={`w-full !p-3.5 !h-auto rounded-2xl border text-xs font-bold transition-all flex items-center justify-between hover:bg-transparent ${
                        selectedReason === option.key
                          ? "!bg-red-50/50 border-red-500 !text-red-600 shadow-sm"
                          : "!bg-slate-50 border-slate-100 !text-slate-700 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{t(option.labelKey as TextKey)}</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          selectedReason === option.key ? "border-red-500 bg-red-500 text-white" : "border-slate-300 bg-white"
                        }`}>
                          {selectedReason === option.key && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </AppButton>
                  ))}
                </div>

                {selectedReason && (
                  <div className="space-y-2 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                      {t("details_label")}
                      {selectedReason === "OTHER" && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder={t("report_details_ph")}
                      className="w-full rounded-2xl bg-slate-50 border border-slate-200 p-3.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all min-h-[90px] resize-none"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <AppButton
                    className="flex-1 h-14 rounded-2xl border-2 border-slate-100 text-slate-500 hover:bg-slate-50 font-black uppercase tracking-widest text-xs"
                    onClick={() => {
                      setShowReportModal(false);
                      setSelectedReason("");
                      setReportDetails("");
                    }}
                  >
                    {t("close_btn")}
                  </AppButton>
                  <AppButton
                    className="flex-1 h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs"
                    onClick={handleSubmitReport}
                    loading={isSubmittingReport}
                    disabled={!selectedReason || (selectedReason === "OTHER" && (!reportDetails || !reportDetails.trim()))}
                  >
                    {t("submit_report")}
                  </AppButton>
                </div>
              </>
            ) : (
              <div className="py-6 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mx-auto mb-4 animate-bounce">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{t("report_success")}</h3>
                <p className="text-sm font-medium text-slate-500 px-4 mb-6">{t("report_submitted_success")}</p>
                <AppButton
                  fullWidth
                  className="h-14 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 font-black uppercase tracking-widest text-xs"
                  onClick={() => {
                    setShowReportModal(false);
                    setReportSubmitted(false);
                    setSelectedReason("");
                    setReportDetails("");
                  }}
                >
                  {t("close_btn")}
                </AppButton>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
