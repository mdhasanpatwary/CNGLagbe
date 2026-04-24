"use client";

import { use, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock3,
  Loader2,
  Navigation,
  Phone,
  Route,
  Search,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { type TextKey } from "@/constants/text";
import { ReportModal } from "@/components/ReportModal";
import { CancelModal } from "@/components/CancelModal";
import { Badge } from "@/components/ui/badge";
import { AppButton } from "@/components/ui/AppButton";
import { Card, CardContent } from "@/components/ui/card";
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

const REQUEST_TIMEOUT_SECONDS = 60;

function getRemainingSeconds(createdAt: string, now = Date.now()) {
  const elapsedSeconds = Math.floor((now - new Date(createdAt).getTime()) / 1000);
  return Math.max(0, REQUEST_TIMEOUT_SECONDS - elapsedSeconds);
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
    booking?.status === "PENDING" ? getRemainingSeconds(booking.createdAt, now) : REQUEST_TIMEOUT_SECONDS;

  useEffect(() => {
    if (booking?.status !== "PENDING") return;

    const timer = setInterval(() => {
      const currentNow = Date.now();
      const remaining = getRemainingSeconds(booking.createdAt, currentNow);
      setNow(currentNow);

      if (remaining <= 0) {
        void fetchBooking();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [booking?.createdAt, booking?.status, fetchBooking]);

  useEffect(() => {
    if (!booking) return;

    const channel = supabase
      .channel(`booking-${id}`)
      .on("broadcast", { event: "location" }, ({ payload }) => {
        if (booking.status === "ACCEPTED" || booking.status === "STARTED") {
          setDriverLocation(payload);
          if (driverMarker.current) {
            driverMarker.current.position = payload;
          }
        }
      })
      .on("broadcast", { event: "status_change" }, () => {
        void fetchBooking();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking, fetchBooking, id]);

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
        await new Promise((resolve) => {
          script.onload = resolve;
        });
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
      } else {
        mapInstance.current.setCenter({ lat: booking.pickupLat, lng: booking.pickupLng });
      }

      if (!pickupMarker.current) {
        pickupMarker.current = new AdvancedMarkerElement({
          map: mapInstance.current,
          position: { lat: booking.pickupLat, lng: booking.pickupLng },
          title: t("pickup"),
          content: new PinElement({
            background: "#10b981",
            borderColor: "#047857",
            glyphColor: "#ffffff",
          }).element,
        });
      }

      if (driverLocation) {
        const driverPin = new PinElement({
          background: "#2563eb",
          borderColor: "#1d4ed8",
          glyphColor: "#ffffff",
        });

        if (!driverMarker.current) {
          driverMarker.current = new AdvancedMarkerElement({
            map: mapInstance.current,
            position: driverLocation,
            title: t("driver"),
            content: driverPin.element,
          });
        } else {
          driverMarker.current.position = driverLocation;
        }
      }
    };

    void initMap();

    return () => {
      cancelled = true;
    };
  }, [booking, countdown, driverLocation, t]);

  if (!booking) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-emerald-500" />
        <p className="font-bold text-slate-500">{t("loading")}</p>
      </div>
    );
  }

  const uiState = getRideUiState(booking, countdown);

  const statusConfig: Record<
    RideUiState,
    {
      badgeLabel: TextKey;
      badgeTone: string;
      title: TextKey;
      helper: TextKey;
      icon: React.ReactNode;
    }
  > = {
    FINDING_DRIVER: {
      badgeLabel: "finding_driver",
      badgeTone: "bg-amber-100 text-amber-700",
      title: "finding_driver",
      helper: "search_timeout_help",
      icon: (
        <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-200 border-t-emerald-500 animate-spin" />
          <Search className="h-10 w-10 text-emerald-600" />
        </div>
      ),
    },
    DRIVER_ASSIGNED: {
      badgeLabel: "driver_assigned",
      badgeTone: "bg-blue-100 text-blue-700",
      title: "driver_assigned",
      helper: "driver_assigned_desc",
      icon: (
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-50">
          <Navigation className="h-10 w-10 text-blue-600" />
        </div>
      ),
    },
    RIDE_STARTED: {
      badgeLabel: "ride_started",
      badgeTone: "bg-blue-100 text-blue-700",
      title: "ride_started",
      helper: "ride_started_desc",
      icon: (
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-50">
          <Navigation className="h-10 w-10 text-blue-600" />
        </div>
      ),
    },
    COMPLETED: {
      badgeLabel: "booking_done",
      badgeTone: "bg-emerald-100 text-emerald-700",
      title: "booking_done",
      helper: "driver_arrived_desc",
      icon: (
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
      ),
    },
    CANCELLED: {
      badgeLabel: booking.status === "TIMED_OUT" ? "no_driver" : "ride_cancelled",
      badgeTone: "bg-red-100 text-red-700",
      title: booking.status === "TIMED_OUT" ? "no_driver" : "ride_cancelled",
      helper: booking.status === "TIMED_OUT" ? "no_driver_desc" : "ride_cancelled_desc",
      icon: (
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-red-50">
          <XCircle className="h-10 w-10 text-red-600" />
        </div>
      ),
    },
  };

  const currentStatus = statusConfig[uiState];
  const cancelLabelKey: TextKey =
    uiState === "FINDING_DRIVER" ? "cancel_request" : "cancel_booking";

  const showCancelAction =
    uiState === "FINDING_DRIVER" ||
    uiState === "DRIVER_ASSIGNED" ||
    uiState === "RIDE_STARTED";

  const showMap = uiState === "DRIVER_ASSIGNED" || uiState === "RIDE_STARTED";
  const showDriverCard =
    (uiState === "DRIVER_ASSIGNED" ||
      uiState === "RIDE_STARTED" ||
      uiState === "COMPLETED") &&
    Boolean(booking.driver);
  const showNewBookingAction = uiState === "COMPLETED" || uiState === "CANCELLED";

  const timeValue = (() => {
    if (uiState === "FINDING_DRIVER") {
      return `${countdown}s`;
    }

    const startTime = booking.acceptedAt || booking.createdAt;
    const endTime = booking.completedAt || booking.cancelledAt || new Date().toISOString();
    const durationSeconds = Math.max(
      0,
      Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000)
    );

    return formatDuration(durationSeconds, t("just_now"));
  })();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-4 shadow-sm">
        <h1 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Navigation size={18} className="text-emerald-500" />
          #{id.slice(-6).toUpperCase()}
        </h1>
        <Badge className={`border-none px-3 py-1 text-xs font-bold ${currentStatus.badgeTone}`}>
          {t(currentStatus.badgeLabel)}
        </Badge>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
        <Card className="rounded-3xl border-none shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 p-5 text-center">
            {currentStatus.icon}
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900">{t(currentStatus.title)}</h2>
              <p className="text-sm font-medium text-slate-500">{t(currentStatus.helper)}</p>
            </div>

            {uiState === "FINDING_DRIVER" && (
              <div className="w-full rounded-2xl bg-amber-50 px-4 py-3">
                <div className="flex items-center justify-between text-sm font-bold text-amber-700">
                  <span>{t("timeout_label")}</span>
                  <span>{countdown}s</span>
                </div>
              </div>
            )}

            {showCancelAction && (
              <AppButton
                fullWidth
                onClick={() => setShowCancel(true)}
                className="h-12 rounded-2xl bg-red-600 text-sm font-bold text-white hover:bg-red-700"
                leftIcon={<XCircle size={16} />}
              >
                {t(cancelLabelKey)}
              </AppButton>
            )}
          </CardContent>
        </Card>

        {showMap && (
          <Card className="rounded-3xl border-none shadow-sm">
            <CardContent className="p-3">
              <div ref={mapRef} className="h-56 w-full rounded-2xl bg-slate-100" />
            </CardContent>
          </Card>
        )}

        {showDriverCard && booking.driver && (
          <Card className="rounded-3xl border-none shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                  {booking.driver.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={booking.driver.photoUrl}
                      alt={booking.driver.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-6 w-6 text-slate-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-400">{t("auto_rickshaw")}</p>
                  <h3 className="truncate text-sm font-black text-slate-900">{booking.driver.name}</h3>
                  {booking.driver.vehicleNumber && (
                    <p className="text-sm font-medium text-slate-500">
                      {t("vehicle_no")}: {booking.driver.vehicleNumber}
                    </p>
                  )}
                </div>
              </div>

              <a
                href={`tel:${booking.driver.phone}`}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                <Phone size={16} />
                {t("call_driver")}
              </a>
            </CardContent>
          </Card>
        )}

        <Card
          className={`rounded-3xl shadow-sm ${
            uiState === "COMPLETED" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
          }`}
        >
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Banknote size={16} className="text-emerald-600" />
              <span>{t("booking_summary")}</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/80 p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Banknote size={14} className="text-emerald-600" />
                  <span>{t("fixed_fare")}</span>
                </div>
                <p className="mt-2 text-sm font-black text-slate-900">
                  {t("currency")}
                  {booking.fare}
                </p>
              </div>

              <div className="rounded-2xl bg-white/80 p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Clock3 size={14} className="text-blue-600" />
                  <span>{t("est_time")}</span>
                </div>
                <p className="mt-2 text-sm font-black text-slate-900">{timeValue}</p>
              </div>

              <div className="rounded-2xl bg-white/80 p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Route size={14} className="text-amber-600" />
                  <span>{t("distance")}</span>
                </div>
                <p className="mt-2 text-sm font-black text-slate-900">
                  {booking.distance.toFixed(1)} {t("km_unit")}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
              {t("pay_driver")}: {t("currency")}
              {booking.fare} • {t("cash_only")}
            </div>
          </CardContent>
        </Card>

        {uiState === "COMPLETED" && (
          <AppButton
            fullWidth
            variant="ghost"
            onClick={() => setShowReport(true)}
            className="h-12 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-100"
            leftIcon={<AlertTriangle size={16} />}
          >
            {t("report_issue")}
          </AppButton>
        )}

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
          onSuccess={() => {
            setShowCancel(false);
            void fetchBooking();
          }}
        />
      )}

      <footer className="p-6 text-center text-xs font-medium text-slate-400">
        {t("app_name")} &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
