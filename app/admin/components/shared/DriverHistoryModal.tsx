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
  ChevronLeft,
  ChevronRight,
  MapPin,
  TrendingUp,
  Route,
  User,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLang } from "@/hooks/useLang";
import { AppButton } from "@/components/ui/AppButton";
import { formatDecimal } from "@/lib/utils";
import { PendingDriver } from "@/lib/types/admin";
import { Skeleton } from "@/components/ui/skeleton";

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

interface DriverHistoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  driver: PendingDriver | null;
}

export function DriverHistoryModal({
  isOpen,
  onOpenChange,
  driver,
}: DriverHistoryModalProps) {
  const { t } = useLang();
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [timeframe, setTimeframe] = useState<string>("all");

  useEffect(() => {
    if (!isOpen || !driver) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          page: page.toString(),
          limit: "10",
          timeframe,
        });
        if (statusFilter !== "ALL") query.append("status", statusFilter);

        const res = await fetch(`/api/admin/drivers/${driver.id}/history?${query.toString()}`);
        const data = await res.json();
        setTrips(data.bookings ?? []);
        setMeta(data.meta ?? null);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, driver, page, statusFilter, timeframe]);

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleTimeframeChange = (tf: string) => {
    setTimeframe(tf);
    setPage(1);
  };

  const stats = meta?.stats || {
    lifetimeTrips: 0,
    totalEarned: 0,
    avgRating: 0,
    ratingCount: 0,
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-slate-50 rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col">
        {/* Header */}
        <div className="bg-white p-6 border-b border-slate-100 sticky top-0 z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 leading-tight">
                  {driver?.name || t("driver_history")}
                </h3>
                <p className="text-sm font-bold text-slate-400 mt-0.5">
                  {driver?.phone} • {driver?.vehicleNumber || "N/A"}
                </p>
              </div>
            </div>
            <AppButton
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-10 h-10 p-0 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </AppButton>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label={t("lifetime_trips")}
              value={stats.lifetimeTrips}
              icon={<TrendingUp className="w-4 h-4" />}
              accent
            />
            <StatCard
              label={t("total_earned")}
              value={
                <span className="text-lg">
                  {t("currency")}
                  {formatDecimal(stats.totalEarned)}
                </span>
              }
              icon={<Banknote className="w-4 h-4" />}
            />
            <StatCard
              label={t("rating_score")}
              value={
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>
                    {stats.avgRating > 0 ? formatDecimal(stats.avgRating, 1) : "—"}
                  </span>
                  {stats.ratingCount > 0 && (
                    <span className="text-[10px] font-bold text-slate-400 mt-1">
                      ({stats.ratingCount})
                    </span>
                  )}
                </div>
              }
              icon={<Star className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-4 flex flex-col gap-4">
          {/* Filters */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                { key: "all", label: t("all_time") },
                { key: "today", label: t("today") },
                { key: "weekly", label: t("last_7_days") },
                { key: "monthly", label: t("this_month") },
              ].map(({ key, label }) => (
                <FilterPill
                  key={key}
                  active={timeframe === key}
                  label={label}
                  onClick={() => handleTimeframeChange(key)}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                { key: "ALL", label: t("all") },
                { key: "COMPLETED", label: t("completed") },
                { key: "CANCELLED", label: t("cancelled") },
              ].map(({ key, label }) => (
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
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-2xl" />
              ))}
            </div>
          ) : trips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                <Navigation size={28} className="text-slate-200" />
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {t("no_trips_found")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {trips.map((trip) => (
                <Card
                  key={trip.id}
                  className="border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden bg-white"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 tabular-nums">
                          {new Intl.DateTimeFormat("en-BD", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(trip.createdAt))}
                        </span>
                      </div>
                      <StatusBadge status={trip.status} />
                    </div>

                    <div className="relative flex flex-col gap-1 mb-3 pl-2">
                      <div className="absolute left-[5px] top-[14px] bottom-[14px] w-px bg-slate-100" />
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 ring-4 ring-primary/10 z-10" />
                        <p className="text-xs font-semibold text-slate-700 line-clamp-1">
                          {trip.pickupAddress || t("pickup_point")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-2.5 h-2.5 text-slate-300 shrink-0 z-10" />
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {trip.destAddress || t("drop_point")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2.5 border-t border-slate-50 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center">
                          <Banknote className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-300 uppercase leading-none mb-0.5">
                            {t("fare")}
                          </p>
                          <p className="text-sm font-black text-slate-800 tabular-nums">
                            {t("currency")}
                            {formatDecimal(trip.totalFare || trip.fare)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-slate-300">
                          <Route className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold tabular-nums">
                            {formatDecimal(trip.distance, 1)} km
                          </span>
                        </div>
                      </div>
                    </div>

                    {trip.status === "COMPLETED" && trip.rating != null ? (
                      <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/50">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${star <= trip.rating!
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-200 fill-slate-200"
                                  }`}
                              />
                            ))}
                          </div>
                          {trip.user && (
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                              {trip.user.name}
                            </span>
                          )}
                        </div>
                        {trip.feedback && (
                          <div className="flex items-start gap-1.5 mt-1.5">
                            <MessageSquare className="w-3 h-3 text-amber-300 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-slate-500 italic">
                              &ldquo;{trip.feedback}&rdquo;
                            </p>
                          </div>
                        )}
                      </div>
                    ) : trip.status === "COMPLETED" ? (
                      <div className="flex items-center gap-1.5 text-slate-200 py-1">
                        <Star className="w-3 h-3" />
                        <p className="text-[10px] font-bold uppercase tracking-wider">
                          {t("not_rated")}
                        </p>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 pb-4">
              <AppButton
                variant="ghost"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
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
        </div>
      </div>
    </div>
  );
}

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
      className={`flex flex-col items-center justify-center p-3 rounded-2xl border shadow-sm text-center ${accent
          ? "bg-primary text-white border-primary"
          : "bg-white border-slate-100"
        }`}
    >
      <div className={`mb-1.5 ${accent ? "text-white/80" : "text-slate-400"}`}>
        {icon}
      </div>
      <p
        className={`text-[9px] font-black uppercase tracking-tight mb-0.5 ${accent ? "text-white/70" : "text-slate-400"
          }`}
      >
        {label}
      </p>
      <div
        className={`text-lg font-black leading-none ${accent ? "text-white" : "text-slate-800"
          }`}
      >
        {value}
      </div>
    </div>
  );
}

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
      className={`whitespace-nowrap !h-8 !rounded-full !text-[11px] !font-black !uppercase !tracking-widest !px-4 ${active
          ? "shadow-sm shadow-primary/30"
          : "!bg-white !text-slate-500 border border-slate-200 hover:border-primary/40 hover:!text-primary"
        }`}
    >
      {label}
    </AppButton>
  );
}

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
