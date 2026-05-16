"use client";

import { useEffect, useState } from "react";
import {
  ChevronRight,
  Calendar,
  Banknote,
  Navigation,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useLang } from "@/hooks/useLang";
import { Header } from "@/components/layout/Header";
import { PageHeading } from "@/components/ui/PageHeading";
import { AppButton } from "@/components/ui/AppButton";
import { HistoryListSkeleton } from "@/components/ui/AppSkeletons";
import { apiFetch } from "@/utils/api";

import { Booking } from "@/lib/types/booking";
import { User } from "@/lib/types/user";


// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary-dark text-[10px] font-black uppercase tracking-wider">
        <CheckCircle2 className="w-3 h-3" />
        <span>Completed</span>
      </span>
    );
  }
  if (status === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wider">
        <XCircle className="w-3 h-3" />
        <span>Cancelled</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider">
      <Clock className="w-3 h-3" />
      <span>{status}</span>
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

// ─── Empty State ─────────────────────────────────────────────────────────────

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

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function BookingHistoryPage() {
  const { t } = useLang();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ totalPages: number } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [timeframe, setTimeframe] = useState<string>("all");

  useEffect(() => {
    let active = true;
    apiFetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) setUser(data.user);
      })
      .catch((err) => console.error("Failed to fetch user:", err));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({
      page: page.toString(),
      limit: "10",
      timeframe,
    });
    if (statusFilter !== "ALL") query.append("status", statusFilter);

    apiFetch(`/api/user/bookings?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          setBookings(data.bookings ?? []);
          setMeta(data.meta ?? null);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch bookings:", err);
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
    <div className="flex flex-col min-h-screen premium-bg-surface relative overflow-hidden">
      <div className="absolute inset-0 dot-grid-texture opacity-30 pointer-events-none" />

      <Header role="user" theme="light" user={user} />

      <main className="flex-1 px-4 pt-2 pb-8 max-w-md mx-auto w-full relative z-10">
        <PageHeading
          title={t("booking_history")}
          subtitle={t("user_portal")}
          backHref="/user"
        />

        {/* Filter section */}
        <div className="flex flex-col gap-2 mb-5">
          {/* Timeframe row */}
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

          {/* Status row */}
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

        {/* Content */}
        {loading ? (
          <HistoryListSkeleton />
        ) : bookings.length === 0 ? (
          <EmptyState label={t("no_bookings_found")} />
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map((booking) => (
              <Link key={booking.id} href={`/user/booking/${booking.id}`}>
                <Card className="border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 active:scale-[0.98] rounded-2xl overflow-hidden bg-white group">
                  <CardContent className="p-4">
                    {/* Top row: date + status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 tabular-nums">
                          {new Date(booking.createdAt).toLocaleDateString(
                            "en-BD",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>

                    {/* Route: pickup → drop */}
                    <div className="relative flex flex-col gap-1 mb-3 pl-2">
                      {/* vertical line */}
                      <div className="absolute left-[5px] top-[14px] bottom-[14px] w-px bg-slate-200" />

                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 ring-2 ring-primary/20 z-10" />
                        <p className="text-xs font-semibold text-slate-700 line-clamp-1 leading-tight">
                          {booking.pickupAddress || t("pickup_point")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0 z-10" />
                        <p className="text-xs text-slate-400 line-clamp-1 leading-tight">
                          {booking.destAddress || t("drop_point")}
                        </p>
                      </div>
                    </div>

                    {/* Bottom row: fare + cta */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-lg bg-primary/8 flex items-center justify-center">
                          <Banknote className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-black text-slate-800 tabular-nums">
                          {t("currency")}
                          {booking.fare}
                        </span>
                      </div>
                      <span className="flex items-center gap-0.5 text-[10px] font-black text-slate-300 group-hover:text-primary transition-colors uppercase tracking-widest">
                        {t("view_details")}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-5 pb-4 mt-2">
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
