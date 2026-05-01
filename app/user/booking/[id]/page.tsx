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
import { ReportModal } from "@/components/ReportModal";
import { CancelModal } from "@/components/CancelModal";
import { Badge } from "@/components/ui/badge";
import { AppButton } from "@/components/ui/AppButton";
import { useLang } from "@/hooks/useLang";
import { supabase } from "@/lib/supabase";

interface Booking {
  id: string;
  status: "PENDING" | "ACCEPTED" | "STARTED" | "COMPLETED" | "CANCELLED" | "TIMED_OUT";
  fare: number;
  distance: number;
  pickupLat: number;
  pickupLng: number;
  destLat: number;
  destLng: number;
  pickupAddress?: string | null;
  destAddress?: string | null;
  polyline?: string | null;
  createdAt: string;
  acceptedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  driver?: {
    name: string;
    phone: string;
    vehicleNumber?: string;
    photoUrl?: string;
  } | null;
}

type RideUiState =
  | "FINDING_DRIVER"
  | "DRIVER_ASSIGNED"
  | "RIDE_STARTED"
  | "COMPLETED"
  | "CANCELLED";

function getRemainingSeconds(createdAt: string, now = Date.now()) {
  const elapsedSeconds = Math.floor((now - new Date(createdAt).getTime()) / 1000);
  return Math.max(0, BOOKING_REQUEST_TIMEOUT_SECONDS - elapsedSeconds);
}

function getRideUiState(booking: Booking, countdown: number): RideUiState {
  if (booking.status === "COMPLETED") return "COMPLETED";
  if (booking.status === "CANCELLED" || booking.status === "TIMED_OUT" || countdown === 0) {
    return "CANCELLED";
  }
  if (booking.status === "STARTED") return "RIDE_STARTED";
  if (booking.status === "ACCEPTED") return "DRIVER_ASSIGNED";
  return "FINDING_DRIVER";
}

function formatDuration(totalSeconds: number, justNowLabel: string) {
  if (totalSeconds <= 0) return justNowLabel;
  const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export default function UserBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useLang();
  const router = useRouter();
  const { id } = use(params);

  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const pickupMarker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const driverMarker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

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
        if (booking.status === "ACCEPTED" || booking.status === "STARTED") {
          setDriverLocation(payload);
          if (driverMarker.current) driverMarker.current.position = payload;
        }
      })
      .on("broadcast", { event: "status_change" }, () => { void fetchBooking(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [booking, fetchBooking, id]);

  // Map init for DRIVER_ASSIGNED / RIDE_STARTED
  useEffect(() => {
    if (!booking || !mapRef.current) return;
    const uiState = getRideUiState(booking, countdown);
    if (uiState !== "DRIVER_ASSIGNED" && uiState !== "RIDE_STARTED") return;

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
          content: new PinElement({ background: "#10b981", borderColor: "#047857", glyphColor: "#ffffff" }).element,
        });
      }

      if (driverLocation && !driverMarker.current) {
        driverMarker.current = new AdvancedMarkerElement({
          map: mapInstance.current,
          position: driverLocation,
          title: t("driver"),
          content: new PinElement({ background: "#2563eb", borderColor: "#1d4ed8", glyphColor: "#ffffff" }).element,
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
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-24 h-24 rounded-full bg-emerald-400/30 pulse-ring" />
          <div className="absolute w-24 h-24 rounded-full bg-emerald-400/20 pulse-ring pulse-ring-delay-1" />
          <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
            <Navigation size={24} className="text-white" />
          </div>
        </div>
        <p className="font-bold text-slate-500">{t("loading")}</p>
      </div>
    );
  }

  const uiState = getRideUiState(booking, countdown);
  const cancelLabelKey: TextKey = uiState === "FINDING_DRIVER" ? "cancel_request" : "cancel_booking";
  const showCancelAction = uiState === "FINDING_DRIVER" || uiState === "DRIVER_ASSIGNED" || uiState === "RIDE_STARTED";
  const showMap = uiState === "DRIVER_ASSIGNED" || uiState === "RIDE_STARTED";
  const showDriverCard = (uiState === "DRIVER_ASSIGNED" || uiState === "RIDE_STARTED" || uiState === "COMPLETED") && Boolean(booking.driver);
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
  const badgeConfig: Record<RideUiState, { tone: string; label: TextKey }> = {
    FINDING_DRIVER: { tone: "bg-amber-100 text-amber-700", label: "finding_driver" },
    DRIVER_ASSIGNED: { tone: "bg-blue-100 text-blue-700", label: "driver_assigned" },
    RIDE_STARTED: { tone: "bg-blue-100 text-blue-700", label: "ride_started" },
    COMPLETED: { tone: "bg-emerald-100 text-emerald-700", label: "booking_done" },
    CANCELLED: {
      tone: "bg-red-100 text-red-700",
      label: booking.status === "TIMED_OUT" ? "no_driver" : "ride_cancelled",
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
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Navigation size={16} className="text-emerald-500" />
          <span className="text-sm font-black text-slate-800">#{id.slice(-6).toUpperCase()}</span>
        </div>
        <Badge className={`border-none px-3 py-1 text-xs font-bold ${badge.tone}`}>
          {t(badge.label)}
        </Badge>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">

        {/* ── FINDING DRIVER STATE ──────────────────────────────────────── */}
        {uiState === "FINDING_DRIVER" && (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            {/* Animated visual */}
            <div className="flex flex-col items-center py-10 px-6">
              <div className="relative flex items-center justify-center mb-6">
                <div className="absolute w-36 h-36 rounded-full bg-emerald-400/20 pulse-ring" />
                <div className="absolute w-36 h-36 rounded-full bg-emerald-400/15 pulse-ring pulse-ring-delay-1" />
                <div className="absolute w-36 h-36 rounded-full bg-emerald-400/10 pulse-ring pulse-ring-delay-2" />
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-2xl flex items-center justify-center">
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
                    className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 rounded-full transition-all duration-1000"
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

        {/* ── DRIVER ASSIGNED / RIDE STARTED STATE ─────────────────────── */}
        {(uiState === "DRIVER_ASSIGNED" || uiState === "RIDE_STARTED") && (
          <>
            {/* Map */}
            {showMap && (
              <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                <div ref={mapRef} className="h-52 w-full bg-slate-100" />
              </div>
            )}

            {/* Driver card */}
            {showDriverCard && booking.driver && (
              <div className="bg-white rounded-3xl shadow-sm p-5">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-wider">
                  {uiState === "DRIVER_ASSIGNED" ? t("driver_assigned") : t("ride_started")}
                </p>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                    {booking.driver.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={booking.driver.photoUrl} alt={booking.driver.name} className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon className="h-7 w-7 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">{t("auto_rickshaw")}</p>
                    <h3 className="text-lg font-black text-slate-900 truncate">{booking.driver.name}</h3>
                    {booking.driver.vehicleNumber && (
                      <p className="text-sm font-medium text-slate-500">{t("vehicle_no")}: {booking.driver.vehicleNumber}</p>
                    )}
                  </div>
                </div>
                <a
                  href={`tel:${booking.driver.phone}`}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-[0.98]"
                >
                  <Phone size={16} />
                  {t("call_driver")}
                </a>
              </div>
            )}

            {/* Pickup location */}
            <div className="bg-white rounded-3xl shadow-sm px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 mt-1 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <div className="w-0.5 h-5 bg-slate-200" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">{t("pickup")}</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">
                    {booking.pickupAddress && !booking.pickupAddress.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/) 
                      ? booking.pickupAddress 
                      : t("pickup")}
                  </p>
                  <p className="text-[10px] text-slate-400 mb-2 truncate">
                    {`${booking.pickupLat.toFixed(4)}, ${booking.pickupLng.toFixed(4)}`}
                  </p>
                  
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">{t("drop")}</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">
                    {booking.destAddress && !booking.destAddress.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/)
                      ? booking.destAddress
                      : t("drop")}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {`${booking.destLat.toFixed(4)}, ${booking.destLng.toFixed(4)}`}
                  </p>
                </div>
              </div>
            </div>

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
              <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <CheckCircle2 size={44} className="text-emerald-500" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-1">{t("booking_done")}</h2>
              <p className="text-sm font-medium text-slate-500 text-center">{t("driver_arrived_desc")}</p>
            </div>

            {showDriverCard && booking.driver && (
              <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                    {booking.driver.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={booking.driver.photoUrl} alt={booking.driver.name} className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">{booking.driver.name}</h3>
                    {booking.driver.vehicleNumber && (
                      <p className="text-xs font-medium text-slate-500">{booking.driver.vehicleNumber}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CANCELLED STATE ───────────────────────────────────────────── */}
        {uiState === "CANCELLED" && (
          <div className="bg-white rounded-3xl shadow-sm">
            <div className="flex flex-col items-center py-10 px-6">
              <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <XCircle size={44} className="text-red-400" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-1">
                {t(booking.status === "TIMED_OUT" ? "no_driver" : "ride_cancelled")}
              </h2>
              <p className="text-sm font-medium text-slate-500 text-center">
                {t(booking.status === "TIMED_OUT" ? "no_driver_desc" : "ride_cancelled_desc")}
              </p>

              {booking.status === "TIMED_OUT" && (
                <div className="mt-8 w-full">
                  <AppButton
                    fullWidth
                    onClick={handleRequestAgain}
                    className="h-12 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-bold shadow-lg shadow-emerald-200"
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
        <div className={`rounded-3xl shadow-sm ${uiState === "COMPLETED" ? "bg-emerald-50 border border-emerald-100" : "bg-white"}`}>
          <div className="p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-4">
              <Banknote size={16} className="text-emerald-600" />
              <span>{t("booking_summary")}</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/80 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1.5">
                  <Banknote size={13} className="text-emerald-600" />
                  <span>{t("fixed_fare")}</span>
                </div>
                <p className="text-base font-black text-slate-900">{t("currency")}{booking.fare}</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1.5">
                  <Clock3 size={13} className="text-blue-500" />
                  <span>{t("est_time")}</span>
                </div>
                <p className="text-base font-black text-slate-900">{timeValue}</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-3">
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

        {/* Pickup/drop summary */}
        {(booking.pickupAddress || booking.destAddress) && (
          <div className="bg-white rounded-3xl shadow-sm px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 mt-1 shrink-0">
                <MapPin size={14} className="text-emerald-500" />
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
