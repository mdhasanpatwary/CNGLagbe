"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Banknote,
  Navigation,
  Loader2,
  Star,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  Route,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLang } from "@/hooks/useLang";
import { Header } from "@/components/layout/Header";
import { PageHeading } from "@/components/ui/PageHeading";
import { apiFetch } from "@/utils/api";

interface TripRecord {
  id: string;
  status: "COMPLETED" | "CANCELLED";
  fare: number;
  baseFare?: number | null;
  platformFee?: number | null;
  totalFare?: number | null;
  distance: number;
  pickupAddress?: string | null;
  destAddress?: string | null;
  createdAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  rating?: number | null;
  feedback?: string | null;
  user?: {
    name: string;
    phone: string;
  } | null;
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3 h-3 ${
            star <= value
              ? "text-amber-400 fill-amber-400"
              : "text-slate-200 fill-slate-200"
          }`}
        />
      ))}
      <span className="text-xs font-black text-amber-500 ml-1">{value.toFixed(1)}</span>
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export default function DriverHistoryPage() {
  const { t } = useLang();
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/driver/history")
      .then((res) => res.json())
      .then((data) => setTrips(data.bookings ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
          {t("loading")}
        </p>
      </div>
    );
  }

  const completed = trips.filter((t) => t.status === "COMPLETED");
  const totalEarned = completed.reduce((sum, t) => sum + (t.totalFare ?? t.fare), 0);
  const ratedTrips = completed.filter((t) => t.rating != null);
  const avgRating =
    ratedTrips.length > 0
      ? ratedTrips.reduce((sum, t) => sum + (t.rating ?? 0), 0) / ratedTrips.length
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-primary/8 via-transparent to-transparent pointer-events-none" />

      <Header role="driver" />

      <main className="relative p-6 w-full max-w-md mx-auto flex flex-col gap-5 flex-1">
        <PageHeading
          title={t("trip_history")}
          subtitle={t("driver_portal")}
          backHref="/driver/dashboard"
        />

        {/* Summary strip */}
        {trips.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-none bg-white/90 backdrop-blur-xl shadow-md rounded-2xl">
              <CardContent className="p-3 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1">
                  {t("lifetime_trips")}
                </p>
                <p className="text-xl font-black text-primary">{completed.length}</p>
              </CardContent>
            </Card>
            <Card className="border-none bg-white/90 backdrop-blur-xl shadow-md rounded-2xl">
              <CardContent className="p-3 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1">
                  {t("total_earned")}
                </p>
                <p className="text-xl font-black text-slate-800">
                  {t("currency")}{totalEarned}
                </p>
              </CardContent>
            </Card>
            <Card className="border-none bg-white/90 backdrop-blur-xl shadow-md rounded-2xl">
              <CardContent className="p-3 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1">
                  {t("rating_score")}
                </p>
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <p className="text-xl font-black text-slate-800">
                    {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trip list */}
        {trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400">
            <Navigation size={48} className="mb-4 opacity-10" />
            <p className="font-bold uppercase tracking-widest text-xs">
              {t("no_trips_yet")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {trips.map((trip) => (
              <Card
                key={trip.id}
                className="border-none bg-white/90 backdrop-blur-xl shadow-lg shadow-slate-200/40 rounded-2xl overflow-hidden"
              >
                <CardContent className="p-5">
                  {/* Header row */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-slate-100 p-2 rounded-xl">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        {formatDate(trip.createdAt)}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border-none flex items-center gap-1 ${
                        trip.status === "COMPLETED"
                          ? "bg-primary/10 text-primary-dark"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {trip.status === "COMPLETED" ? (
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      ) : (
                        <XCircle className="w-2.5 h-2.5" />
                      )}
                      {trip.status === "COMPLETED" ? t("completed") : t("cancelled")}
                    </Badge>
                  </div>

                  {/* Route */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <p className="text-xs font-bold text-slate-700 line-clamp-1">
                        {trip.pickupAddress || t("pickup_point")}
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                      <p className="text-xs font-medium text-slate-400 line-clamp-1">
                        {trip.destAddress || t("drop_point")}
                      </p>
                    </div>
                  </div>

                  {/* Fare & distance */}
                  <div className="flex items-center justify-between py-3 border-t border-b border-slate-50 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/5 p-1.5 rounded-lg text-primary">
                        <Banknote className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">
                          {trip.platformFee ? t("total_payable") : t("fare")}
                        </p>
                        <p className="text-sm font-black text-slate-800">
                          {t("currency")}{trip.totalFare ?? trip.fare}
                        </p>
                      </div>
                    </div>
                    {trip.platformFee && (
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase">
                          {t("platform_fee")}
                        </p>
                        <p className="text-xs font-black text-red-500">
                          −{t("currency")}{trip.platformFee}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-slate-400">
                      <Route className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">
                        {trip.distance.toFixed(1)} km
                      </span>
                    </div>
                  </div>

                  {/* Passenger rating — only for completed with rating */}
                  {trip.status === "COMPLETED" && trip.rating != null ? (
                    <div className="bg-amber-50/70 rounded-xl p-3 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <StarRating value={trip.rating} />
                        {trip.user && (
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-auto">
                            {trip.user.name}
                          </span>
                        )}
                      </div>
                      {trip.feedback && (
                        <div className="flex items-start gap-2 mt-0.5">
                          <MessageSquare className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-slate-600 italic leading-relaxed">
                            &ldquo;{trip.feedback}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  ) : trip.status === "COMPLETED" ? (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Star className="w-3 h-3" />
                      <p className="text-[10px] font-bold uppercase tracking-wider">
                        {t("not_rated")}
                      </p>
                    </div>
                  ) : null}

                  {/* Cancellation time */}
                  {trip.status === "CANCELLED" && trip.cancelledAt && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-3 h-3" />
                      <p className="text-[10px] font-bold">
                        {formatDate(trip.cancelledAt)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <footer className="p-8 text-center opacity-30">
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">{t("app_name")}</p>
      </footer>
    </div>
  );
}
