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
  MapPin,
  TrendingUp,
  Search,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLang } from "@/hooks/useLang";
import { Header } from "@/components/layout/Header";
import { PageHeading } from "@/components/ui/PageHeading";
import { AppButton } from "@/components/ui/AppButton";
import { DriverHistorySkeleton } from "@/components/ui/AppSkeletons";
import { apiFetch } from "@/utils/api";
import { formatDecimal } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
    stats: {
      lifetimeTrips: number;
      totalEarned: number;
      avgRating: number;
      ratingCount: number;
    };
}

// ─── Star Rating ─────────────────────────────────────────────────────────────

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
      <span className="text-xs font-black text-amber-500 ml-1">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

// ─── Date Format ─────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function formatDateShort(dateStr: string) {
  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "COMPLETED" | "CANCELLED" }) {
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary-dark text-[10px] font-black uppercase tracking-wider">
        <CheckCircle2 className="w-3 h-3" />
        <span>Done</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wider">
      <XCircle className="w-3 h-3" />
      <span>Cancelled</span>
    </span>
  );
}

// ─── Filter Pill ─────────────────────────────────────────────────────────────

function FilterPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <AppButton
      variant={active ? "primary" : "ghost"}
      onClick={onClick}
      className={`whitespace-nowrap !h-8 !rounded-full !text-[11px] !font-black !uppercase !tracking-widest !px-4 ${
        active ? "shadow-sm shadow-primary/30" : "!bg-white !text-slate-500 border border-slate-200 hover:border-primary/40 hover:!text-primary"
      }`}
    >
      {label}
    </AppButton>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Navigation size={28} className="text-slate-300" />
      </div>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
        {label}
      </p>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-3 rounded-2xl border shadow-sm text-center ${
        accent
          ? "bg-primary text-white border-primary"
          : "bg-white border-slate-100"
      }`}
    >
      <div
        className={`mb-1.5 ${
          accent ? "text-white/80" : "text-slate-400"
        }`}
      >
        {icon}
      </div>
      <p
        className={`text-[9px] font-black uppercase tracking-tight mb-0.5 ${
          accent ? "text-white/70" : "text-slate-400"
        }`}
      >
        {label}
      </p>
      <div
        className={`text-lg font-black leading-none ${
          accent ? "text-white" : "text-slate-800"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DriverHistoryPage() {
  const { t } = useLang();
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [timeframe, setTimeframe] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search query changes
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setIsSearching(false);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({
      page: page.toString(),
      limit: "10",
      timeframe,
    });
    if (statusFilter !== "ALL") query.append("status", statusFilter);
    if (debouncedSearchQuery.trim()) {
      query.append("search", debouncedSearchQuery.trim());
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
  }, [page, statusFilter, timeframe, debouncedSearchQuery]);

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

  const stats = meta?.stats || { lifetimeTrips: 0, totalEarned: 0, avgRating: 0, ratingCount: 0 };

  const timeframeOptions = [
    { key: "all", label: t("all_time") },
    { key: "today", label: t("today") },
    { key: "weekly", label: t("last_7_days") },
    { key: "monthly", label: t("this_month") },
  ];

  const statusOptions = [
    { key: "ALL", label: t("all") },
    { key: "COMPLETED", label: t("completed") },
    { key: "CANCELLED", label: t("cancelled") },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-24 premium-bg-surface relative overflow-hidden">
      <div className="absolute inset-0 dot-grid-texture opacity-30 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      <Header role="driver" />

      <main className="relative px-4 pt-2 pb-8 w-full max-w-md mx-auto flex flex-col gap-4 flex-1">
        <PageHeading
          title={t("trip_history")}
          subtitle={t("driver_portal")}
          backHref="/driver/dashboard"
        />

        {/* Stats strip */}
        {loading && page === 1 ? (
          <DriverHistorySkeleton />
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2.5">
              <StatCard
                label={t("lifetime_trips")}
                value={stats.lifetimeTrips}
                icon={<TrendingUp className="w-4 h-4" />}
                accent
              />
              <StatCard
                label={t("total_earned")}
                value={
                  <span className="text-base">
                    {t("currency")}
                    {formatDecimal(stats.totalEarned)}
                  </span>
                }
                icon={<Banknote className="w-4 h-4" />}
              />
              <StatCard
                label={t("rating_score")}
                value={
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>
                        {stats.avgRating > 0 ? formatDecimal(stats.avgRating, 1) : "—"}
                      </span>
                    </div>
                    {stats.ratingCount > 0 && (
                      <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                        ({stats.ratingCount})
                      </span>
                    )}
                  </div>
                }
                icon={<Star className="w-4 h-4" />}
              />
            </div>

            {/* Search Input */}
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setPage(1);
                  setSearchQuery(val);
                  if (val.trim()) {
                    setIsSearching(true);
                  } else {
                    setIsSearching(false);
                  }
                }}
                placeholder={t("search_placeholder")}
                className="block w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-2xl bg-white text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all shadow-sm"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-primary border-t-transparent" />
                </div>
              )}
              {!isSearching && searchQuery && (
                <AppButton
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setSearchQuery("");
                    setIsSearching(false);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-slate-600 text-slate-400 transition-colors !p-0 !h-auto !bg-transparent hover:!bg-transparent active:scale-100 focus:ring-0 focus:ring-offset-0"
                >
                  <X className="h-4 w-4" />
                </AppButton>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {timeframeOptions.map(({ key, label }) => (
                  <FilterPill
                    key={key}
                    active={timeframe === key}
                    label={label}
                    onClick={() => handleTimeframeChange(key)}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {statusOptions.map(({ key, label }) => (
                  <FilterPill
                    key={key}
                    active={statusFilter === key}
                    label={label}
                    onClick={() => handleStatusChange(key)}
                  />
                ))}
              </div>
            </div>

            {/* Trip list */}
            {trips.length === 0 ? (
              <EmptyState label={t("no_trips_yet")} />
            ) : (
              <div className="flex flex-col gap-3">
                {trips.map((trip) => (
                  <Card
                    key={trip.id}
                    className="border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 rounded-2xl overflow-hidden bg-white"
                  >
                    <CardContent className="p-4">
                      {/* Top row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-400 tabular-nums">
                            {formatDateShort(trip.createdAt)}
                          </span>
                        </div>
                        <StatusBadge status={trip.status} />
                      </div>

                      {/* Route */}
                      <div className="relative flex flex-col gap-1 mb-3 pl-2">
                        <div className="absolute left-[5px] top-[14px] bottom-[14px] w-px bg-slate-200" />
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 ring-2 ring-primary/20 z-10" />
                          <p className="text-xs font-semibold text-slate-700 line-clamp-1 leading-tight">
                            {trip.pickupAddress || t("pickup_point")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0 z-10" />
                          <p className="text-xs text-slate-400 line-clamp-1 leading-tight">
                            {trip.destAddress || t("drop_point")}
                          </p>
                        </div>
                      </div>

                      {/* Fare + distance */}
                      <div className="flex items-center justify-between py-2.5 border-t border-b border-slate-50 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-primary/8 flex items-center justify-center">
                            <Banknote className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">
                              {trip.platformFee ? t("total_payable") : t("fare")}
                            </p>
                            <p className="text-sm font-black text-slate-800 tabular-nums">
                              {t("currency")}
                              {formatDecimal(trip.totalFare || trip.fare)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {trip.platformFee && (
                            <div className="text-right">
                              <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">
                                {t("platform_fee")}
                              </p>
                              <p className="text-xs font-black text-red-500 tabular-nums">
                                −{t("currency")}
                                {formatDecimal(trip.platformFee)}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-slate-400">
                            <Route className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold tabular-nums">
                              {formatDecimal(trip.distance, 1)} km
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Passenger rating */}
                      {trip.status === "COMPLETED" && trip.rating != null ? (
                        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100/80">
                          <div className="flex items-center justify-between mb-1">
                            <StarRating value={trip.rating} />
                            {trip.user && (
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                {trip.user.name}
                              </span>
                            )}
                          </div>
                          {trip.feedback && (
                            <div className="flex items-start gap-1.5 mt-1.5">
                              <MessageSquare className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                              <p className="text-[11px] text-slate-600 italic leading-relaxed">
                                &ldquo;{trip.feedback}&rdquo;
                              </p>
                            </div>
                          )}
                        </div>
                      ) : trip.status === "COMPLETED" ? (
                        <div className="flex items-center gap-1.5 text-slate-300 py-1">
                          <Star className="w-3 h-3" />
                          <p className="text-[10px] font-bold uppercase tracking-wider">
                            {t("not_rated")}
                          </p>
                        </div>
                      ) : null}

                      {/* Cancellation time */}
                      {trip.status === "CANCELLED" && trip.cancelledAt && (
                        <div className="flex items-center gap-1.5 text-slate-400 pt-1">
                          <Clock className="w-3 h-3 text-red-400" />
                          <p className="text-[10px] font-bold text-slate-400">
                            {formatDate(trip.cancelledAt)}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 pb-4">
            <AppButton
              variant="ghost"
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
              className="!h-9 !rounded-xl !text-[10px] !font-black !px-4"
            >
              <div className="flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" />
                {t("prev")}
              </div>
            </AppButton>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {t("page")} {page} / {meta.totalPages}
            </span>
            <AppButton
              variant="ghost"
              onClick={() =>
                handlePageChange(Math.min(meta.totalPages, page + 1))
              }
              disabled={page === meta.totalPages || loading}
              className="!h-9 !rounded-xl !text-[10px] !font-black !px-4"
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
