"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Banknote,
  Navigation,
  Star,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  Route,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLang } from "@/hooks/useLang";
import { Header } from "@/components/layout/Header";
import { PageHeading } from "@/components/ui/PageHeading";
import { AppButton } from "@/components/ui/AppButton";
import { Skeleton } from "@/components/ui/skeleton";
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

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    lifetimeTrips: number;
    totalEarned: number;
    avgRating: number;
  };
}

const HistorySkeleton = () => (
  <div className="flex flex-col gap-5">
    {/* Stats Skeleton */}
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-none bg-white/90 shadow-md rounded-2xl">
          <CardContent className="p-3 text-center">
            <Skeleton className="w-16 h-2 mx-auto mb-2" />
            <Skeleton className="w-10 h-6 mx-auto" />
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Trips Skeleton */}
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden border-none shadow-md rounded-[2rem]">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-xl" />
                <Skeleton className="w-32 h-3 rounded-full" />
              </div>
              <Skeleton className="w-16 h-4 rounded-md" />
            </div>
            <div className="space-y-3 mb-4">
              <Skeleton className="w-full h-3 rounded-full" />
              <Skeleton className="w-2/3 h-3 rounded-full" />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <Skeleton className="w-20 h-5 rounded-lg" />
              <Skeleton className="w-24 h-4 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default function DriverHistoryPage() {
  const { t } = useLang();
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [timeframe, setTimeframe] = useState<string>("all");

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({
      page: page.toString(),
      limit: "10",
      timeframe: timeframe,
    });
    if (statusFilter !== "ALL") {
      query.append("status", statusFilter);
    }

    apiFetch(`/api/driver/history?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          setTrips(data.bookings ?? []);
          setMeta(data.meta ?? null);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch history:", err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, statusFilter, timeframe]);

  const handleStatusChange = (status: string) => {
    setLoading(true);
    setStatusFilter(status);
    setPage(1);
  };

  const handleTimeframeChange = (tf: string) => {
    setLoading(true);
    setTimeframe(tf);
    setPage(1);
  };

  const handlePageChange = (p: number) => {
    setLoading(true);
    setPage(p);
  };


  const stats = meta?.stats || { lifetimeTrips: 0, totalEarned: 0, avgRating: 0 };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
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
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-none bg-white/90 backdrop-blur-xl shadow-md rounded-2xl">
            <CardContent className="p-3 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1">
                {t("lifetime_trips")}
              </p>
              <p className="text-xl font-black text-primary">{stats.lifetimeTrips}</p>
            </CardContent>
          </Card>
          <Card className="border-none bg-white/90 backdrop-blur-xl shadow-md rounded-2xl">
            <CardContent className="p-3 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1">
                {t("total_earned")}
              </p>
              <p className="text-xl font-black text-slate-800">
                {t("currency")}{stats.totalEarned}
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
                  {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {["all", "today", "weekly", "monthly"].map((tf) => (
              <AppButton
                key={tf}
                variant={timeframe === tf ? "primary" : "ghost"}
                onClick={() => handleTimeframeChange(tf)}
                className="whitespace-nowrap h-9 !rounded-xl !text-[10px] !font-black !px-4"
              >
                {tf === "all" ? t("all_time") : tf === "today" ? t("today") : tf === "weekly" ? t("last_7_days") : t("this_month")}
              </AppButton>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {["ALL", "COMPLETED", "CANCELLED"].map((f) => (
              <AppButton
                key={f}
                variant={statusFilter === f ? "primary" : "ghost"}
                onClick={() => handleStatusChange(f)}
                className="whitespace-nowrap h-9 !rounded-xl !text-[10px] !font-black !px-4"
              >
                {f === "ALL" ? t("all") : f === "COMPLETED" ? t("completed") : t("cancelled")}
              </AppButton>
            ))}
          </div>
        </div>

        {/* Trip list */}
        {loading && page === 1 ? (
           <HistorySkeleton />
        ) : trips.length === 0 ? (
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
                          {t("currency")}{trip.totalFare || trip.fare}
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

        {/* Pagination Controls */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 pb-8">
            <AppButton
              variant="ghost"
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
              className="!h-10 !rounded-xl !text-[10px] !font-black !px-4"
            >
              <div className="flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" />
                {t("prev")}
              </div>
            </AppButton>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {t("page")} {page} / {meta.totalPages}
              </span>
            </div>
            <AppButton
              variant="ghost"
              onClick={() => handlePageChange(Math.min(meta.totalPages, page + 1))}
              disabled={page === meta.totalPages || loading}
              className="!h-10 !rounded-xl !text-[10px] !font-black !px-4"
            >
              <div className="flex items-center gap-1">
                {t("next")}
                <ChevronRight className="w-4 h-4" />
              </div>
            </AppButton>
          </div>
        )}
      </main>
    </div>
  );
}
