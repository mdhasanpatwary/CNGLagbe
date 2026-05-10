"use client";

import { use, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock3,
  MapPin,
  Navigation,
  Phone,
  Route,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { type TextKey } from "@/constants/text";
import { BOOKING_REQUEST_TIMEOUT_SECONDS } from "@/constants/booking";
import { saveBookingSession } from "@/utils/bookingSession";
import { COLORS } from "@/constants/colors";
import { ReportModal } from "@/components/ReportModal";
import { CancelModal } from "@/components/CancelModal";
import { Badge } from "@/components/ui/badge";
import { AppButton } from "@/components/ui/AppButton";
import { Header } from "@/components/layout/Header";
import { PageHeading } from "@/components/ui/PageHeading";
import { apiFetch } from "@/utils/api";
import { useLang } from "@/hooks/useLang";
import { supabase } from "@/lib/supabase";
import { Booking, BookingUiState } from "@/lib/types/booking";
import { User } from "@/lib/types/user";
import { getRemainingSeconds, getBookingUiState, formatDuration } from "@/lib/booking-utils";

export default function UserBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useLang();
  const router = useRouter();
  const { id } = use(params);

  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [user, setUser] = useState<User | null>(null);
  const [imgError, setImgError] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const pickupMarker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const driverMarker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

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
  const countdown =
    booking?.status === "PENDING"
      ? getRemainingSeconds(booking.createdAt, now)
      : BOOKING_REQUEST_TIMEOUT_SECONDS;

  // Countdown timer
  useEffect(() => {
    if (booking?.status !== "PENDING") return;
    const timer = setInterval(() => {
      const currentNow = Date.now();
      const remaining = getRemainingSeconds(booking.createdAt, currentNow);
      setNow(currentNow);
      if (remaining <= 0) void fetchBooking();
    }, 1000);
    return () => clearInterval(timer);
  }, [booking?.createdAt, booking?.status, fetchBooking]);

  // Realtime via Supabase
  useEffect(() => {
    if (!booking) return;
    const channel = supabase
      .channel(`booking-${id}`)
      .on("broadcast", { event: "location" }, ({ payload }) => {
        if (booking.status === "ACCEPTED") {
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
    if (uiState !== "DRIVER_ASSIGNED") return;

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
            <Navigation size={24} className="text-white" />
          </div>
        </div>
        <p className="font-bold text-slate-500 relative z-10">{t("loading")}</p>
      </div>
    );
  }

  const uiState = getBookingUiState(booking, countdown);
  const cancelLabelKey: TextKey = uiState === "FINDING_DRIVER" ? "cancel_request" : "cancel_booking";
  const showCancelAction = uiState === "FINDING_DRIVER" || uiState === "DRIVER_ASSIGNED";
  const showMap = false; // Map removed upon booking acceptance as per requirement
  const showDriverCard = (uiState === "DRIVER_ASSIGNED" || uiState === "COMPLETED") && Boolean(booking.driver);
  const showNewBookingAction = uiState === "COMPLETED" || uiState === "CANCELLED";

  const progressPct = uiState === "FINDING_DRIVER"
    ? Math.round((countdown / BOOKING_REQUEST_TIMEOUT_SECONDS) * 100)
    : 100;

  const timeValue = (() => {
    if (uiState === "FINDING_DRIVER") return `${countdown}s`;
    const startTime = booking.acceptedAt || booking.createdAt;
    const endTime = booking.completedAt || booking.cancelledAt || new Date().toISOString();
    const durationSeconds = Math.max(0, Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000));
    return formatDuration(durationSeconds, t("just_now"));
  })();

  // Status config
  const badgeConfig: Record<BookingUiState, { tone: string; label: TextKey }> = {
    FINDING_DRIVER: { tone: "bg-amber-100 text-amber-700", label: "finding_driver" },
    DRIVER_ASSIGNED: { tone: "bg-blue-100 text-blue-700", label: "driver_assigned" },
    COMPLETED: { tone: "bg-primary/10 text-primary-dark", label: "booking_done" },
    CANCELLED: {
      tone: "bg-red-100 text-red-700",
      label: booking.status === "TIMED_OUT" ? "no_driver" : "booking_cancelled",
    },
    TIMED_OUT: {
      tone: "bg-red-100 text-red-700",
      label: "no_driver",
    },
  };
  const badge = badgeConfig[uiState];

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
        rightContent={
          !showDriverCard && uiState !== "TIMED_OUT" && uiState !== "CANCELLED" && (
            <Badge className={`border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest ${badge.tone}`}>
              {t(badge.label)}
            </Badge>
          )
        }
      />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4 relative z-10">
        <PageHeading
          title={t("booking_details") as string}
          subtitle={t("user_portal") as string}
          className="mb-2"
        />

        {/* ── FINDING DRIVER STATE ──────────────────────────────────────── */}
        {uiState === "FINDING_DRIVER" && (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            {/* Animated visual */}
            <div className="flex flex-col items-center py-10 px-6">
              <div className="relative flex items-center justify-center mb-6">
                <div className="absolute w-36 h-36 rounded-full bg-primary/20 pulse-ring" />
                <div className="absolute w-36 h-36 rounded-full bg-primary/15 pulse-ring pulse-ring-delay-1" />
                <div className="absolute w-36 h-36 rounded-full bg-primary/10 pulse-ring pulse-ring-delay-2" />
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-light to-primary-dark shadow-2xl flex items-center justify-center">
                  <Navigation size={36} className="text-white" />
                </div>
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-1">{t("finding_driver")}</h2>
              <p className="text-sm font-medium text-slate-500 text-center mb-6">{t("search_timeout_help")}</p>

              {/* Countdown progress bar */}
              <div className="w-full">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                  <span>{t("timeout_label")}</span>
                  <span className="text-amber-600 font-black">{countdown}s</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-amber-400 rounded-full transition-all duration-1000"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>

            {showCancelAction && (
              <div className="border-t border-slate-100 px-6 pb-6 pt-4">
                <AppButton
                  fullWidth
                  onClick={() => setShowCancel(true)}
                  className="h-12 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 text-sm font-bold border border-red-100"
                  leftIcon={<XCircle size={16} />}
                >
                  {t(cancelLabelKey)}
                </AppButton>
              </div>
            )}
          </div>
        )}

        {/* ── DRIVER ASSIGNED STATE ─────────────────────── */}
        {uiState === "DRIVER_ASSIGNED" && (
          <>
            {/* Map */}
            {showMap && (
              <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                <div ref={mapRef} className="h-52 w-full bg-slate-100" />
              </div>
            )}

            {/* Driver card */}
            {showDriverCard && booking.driver && (
              <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                {/* Header Section */}
                <div className="bg-slate-900 px-5 py-4 flex justify-between items-center border-b border-white/5">
                  <div className="flex flex-col">
                    <p className="text-[10px] font-black uppercase text-primary tracking-widest">
                      {t("driver_assigned")}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                      {t("wait_driver")}
                    </p>
                  </div>
                  {booking.driver.vehicleNumber && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{t("vehicle_no")}</span>
                      <div className="license-plate scale-110 origin-right">
                        <span className="text-[10px] font-black bg-slate-900 text-white px-1 rounded-sm mr-1">CNG</span>
                        {booking.driver.vehicleNumber}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  {/* Driver Arriving Animation */}
                  {uiState === "DRIVER_ASSIGNED" && (
                    <div className="w-full relative bg-primary/5 rounded-2xl overflow-hidden mb-6 p-4 border border-primary/10">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-primary uppercase tracking-tight">{t("driver_on_the_way")}</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{t("arriving_soon")}</span>
                        </div>
                        <div className="px-3 py-1 bg-white shadow-sm border border-primary/10 rounded-full text-primary text-[10px] font-black animate-pulse flex items-center gap-1.5">
                          <Clock3 size={12} />
                          {t("wait_minutes")}
                        </div>
                      </div>

                      <div className="w-full h-8 relative">
                        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 flex items-center">
                          {/* Road line */}
                          <div className="w-full border-b-2 border-dashed border-slate-200 relative">
                            {/* Highlighted path */}
                            <div className="absolute top-[-2px] left-0 h-[2px] bg-primary animate-path-fill"></div>
                          </div>
                        </div>
                        {/* Moving CNG */}
                        <div className="absolute top-1/2 -translate-y-1/2 animate-drive-approach z-10">
                          <div className="w-10 h-10 bg-white shadow-xl border-2 border-primary/20 rounded-full flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-dark">
                              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                              <circle cx="7" cy="17" r="2" />
                              <path d="M9 17h6" />
                              <circle cx="17" cy="17" r="2" />
                            </svg>
                          </div>
                        </div>
                        {/* User Location pin */}
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
                  )}

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border-2 border-white shadow-xl ring-4 ring-slate-50 group">
                      {booking.driver.photoUrl && !imgError ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={booking.driver.photoUrl}
                          alt={booking.driver.name}
                          className="h-full w-full object-cover object-top transition-all duration-500"
                          onError={() => setImgError(true)}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center bg-slate-50 w-full h-full">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mb-1">
                            <UserIcon className="h-6 w-6 text-slate-400" />
                          </div>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{t("no_photo")}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-primary/10 text-primary-dark text-[8px] font-black rounded-md uppercase tracking-tighter">
                          {t("top_rated")}
                        </span>
                        {booking.driver.rating && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-amber-500">
                            ★ {booking.driver.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-black text-slate-900 truncate leading-tight">{booking.driver.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mt-1 uppercase tracking-wider">
                        <Navigation size={12} className="text-slate-300" />
                        {t("auto_rickshaw")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{t("vehicle_no")}</p>
                      <p className="text-sm font-black text-slate-900">{booking.driver.vehicleNumber || "---"}</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{t("payment")}</p>
                      <p className="text-sm font-black text-slate-900">{t("currency")}{booking.fare}</p>
                    </div>
                  </div>

                  <a
                    href={`tel:${booking.driver.phone}`}
                    className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-primary text-sm font-black text-white transition-all shadow-lg shadow-primary/20 hover:bg-primary-dark active:scale-[0.97]"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Phone size={18} fill="currentColor" className="text-white" />
                    </div>
                    {t("call_driver")}
                  </a>
                </div>
              </div>
            )}



            {showCancelAction && (
              <AppButton
                fullWidth
                onClick={() => setShowCancel(true)}
                className="h-12 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 text-sm font-bold border border-red-100"
                leftIcon={<XCircle size={16} />}
              >
                {t(cancelLabelKey)}
              </AppButton>
            )}
          </>
        )}

        {/* ── COMPLETED STATE ───────────────────────────────────────────── */}
        {uiState === "COMPLETED" && (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="flex flex-col items-center py-10 px-6">
              <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                <CheckCircle2 size={44} className="text-primary" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-1">{t("booking_done")}</h2>
              <p className="text-sm font-medium text-slate-500 text-center">{t("driver_arrived_desc")}</p>
            </div>

            {showDriverCard && booking.driver && (
              <div className="border-t border-slate-100 px-5 pb-5 pt-4 bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 shadow-sm group">
                    {booking.driver.photoUrl && !imgError ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={booking.driver.photoUrl}
                        alt={booking.driver.name}
                        className="h-full w-full object-cover group-hover:object-top transition-all duration-500"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <UserIcon className="h-5 w-5 text-slate-300" />
                        <span className="text-[6px] font-black text-slate-400 uppercase mt-0.5">{t("no_photo")}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 text-base truncate">{booking.driver.name}</h3>
                    {booking.driver.vehicleNumber && (
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">{t("vehicle_no")}</span>
                        <div className="license-plate scale-90 origin-left">
                          <span className="text-[10px] font-black bg-slate-900 text-white px-1 rounded-sm mr-1">CNG</span>
                          {booking.driver.vehicleNumber}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CANCELLED OR TIMED_OUT STATE ───────────────────────────────────────────── */}
        {(uiState === "CANCELLED" || uiState === "TIMED_OUT") && (
          <div className="bg-white rounded-3xl shadow-sm">
            <div className="flex flex-col items-center py-10 px-6">
              <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <XCircle size={44} className="text-red-400" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-1">
                {t(booking.status === "TIMED_OUT" || uiState === "TIMED_OUT" ? "no_driver" : "booking_cancelled")}
              </h2>
              <p className="text-sm font-medium text-slate-500 text-center">
                {t(booking.status === "TIMED_OUT" || uiState === "TIMED_OUT" ? "no_driver_desc" : "booking_cancelled_desc")}
              </p>

              {(booking.status === "TIMED_OUT" || uiState === "TIMED_OUT") && (
                <div className="mt-8 w-full">
                  <AppButton
                    fullWidth
                    onClick={handleRequestAgain}
                    className="h-12 rounded-2xl bg-primary text-white hover:bg-primary-dark text-sm font-bold shadow-lg shadow-primary/20"
                    leftIcon={<Navigation size={16} />}
                  >
                    {t("retry_booking")}
                  </AppButton>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Booking summary card (always shown) ──────────────────────── */}
        <div className={`rounded-3xl shadow-sm ${uiState === "COMPLETED" ? "bg-primary/5 border border-primary/10" : "bg-white"}`}>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <Banknote size={16} className="text-primary" />
                <span>{t("booking_summary")}</span>
              </div>
              <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                #{id.slice(-6).toUpperCase()}
              </span>
            </div>

            {/* Pickup/drop summary */}
            {(booking.pickupAddress || booking.destAddress) && (
              <div className="mb-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 mt-1 shrink-0">
                    <MapPin size={14} className="text-primary" />
                    <div className="w-0.5 h-6 bg-slate-200" />
                    <MapPin size={14} className="text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-600 truncate">
                      {booking.pickupAddress && !booking.pickupAddress.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/) ? booking.pickupAddress : t("pickup")}
                    </p>
                    <p className="text-[9px] text-slate-400 mb-2 truncate">
                      {`${booking.pickupLat.toFixed(4)}, ${booking.pickupLng.toFixed(4)}`}
                    </p>
                    <p className="text-xs font-semibold text-slate-600 truncate">
                      {booking.destAddress && !booking.destAddress.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/) ? booking.destAddress : t("drop")}
                    </p>
                    <p className="text-[9px] text-slate-400 truncate">
                      {`${booking.destLat.toFixed(4)}, ${booking.destLng.toFixed(4)}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1.5">
                  <Banknote size={13} className="text-primary" />
                  <span>{t("fixed_fare")}</span>
                </div>
                <p className="text-base font-black text-slate-900">{t("currency")}{booking.fare}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1.5">
                  <Clock3 size={13} className="text-blue-500" />
                  <span>{t("est_time")}</span>
                </div>
                <p className="text-base font-black text-slate-900">{timeValue}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1.5">
                  <Route size={13} className="text-amber-500" />
                  <span>{t("distance")}</span>
                </div>
                <p className="text-base font-black text-slate-900">{booking.distance.toFixed(1)} {t("km_unit")}</p>
              </div>
            </div>

            <div className="mt-3 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600">
              {t("pay_driver")}: {t("currency")}{booking.fare} • {t("cash_only")}
            </div>
          </div>
        </div>

        {/* Report issue */}
        {uiState === "COMPLETED" && (
          <AppButton
            fullWidth
            variant="ghost"
            onClick={() => setShowReport(true)}
            className="h-12 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-100"
            leftIcon={<AlertTriangle size={16} />}
          >
            {t("report_issue")}
          </AppButton>
        )}

        {/* New booking */}
        {showNewBookingAction && (
          <Link href="/" className="w-full">
            <AppButton fullWidth variant="secondary" className="h-12 rounded-2xl text-sm font-bold">
              {t("bk_another")}
            </AppButton>
          </Link>
        )}
      </main>

      {showReport && <ReportModal bookingId={id} onClose={() => setShowReport(false)} />}
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

      <footer className="p-6 text-center text-xs font-medium text-slate-400">
        {t("app_name")} &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
