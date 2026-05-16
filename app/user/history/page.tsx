"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Calendar, Banknote, Navigation, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLang } from "@/hooks/useLang";
import { Header } from "@/components/layout/Header";
import { PageHeading } from "@/components/ui/PageHeading";
import { AppButton } from "@/components/ui/AppButton";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/utils/api";

import { Booking } from "@/lib/types/booking";
import { User } from "@/lib/types/user";

const HistorySkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="overflow-hidden border-none shadow-md rounded-[2rem]">
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-xl" />
              <Skeleton className="w-24 h-3 rounded-full" />
            </div>
            <Skeleton className="w-16 h-4 rounded-md" />
          </div>
          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3">
              <Skeleton className="w-1.5 h-1.5 rounded-full mt-1.5" />
              <Skeleton className="w-3/4 h-3 rounded-full" />
            </div>
            <div className="flex items-start gap-3">
              <Skeleton className="w-1.5 h-1.5 rounded-full mt-1.5" />
              <Skeleton className="w-1/2 h-3 rounded-full" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
            <Skeleton className="w-20 h-5 rounded-lg" />
            <Skeleton className="w-24 h-4 rounded-full" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

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
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (active && data) {
          setUser(data.user);
        }
      })
      .catch(err => console.error("Failed to fetch user:", err));
    
    return () => { active = false; };
  }, []);

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


  return (
    <div className="flex flex-col min-h-screen premium-bg-surface relative overflow-hidden">
      <div className="absolute inset-0 dot-grid-texture opacity-50 pointer-events-none" />
      <Header 
        role="user"
        theme="light"
        user={user}
      />

      <main className="flex-1 p-5 pt-2 max-w-md mx-auto w-full relative z-10">
        <PageHeading 
          title={t("booking_history")} 
          subtitle={t("user_portal")}
          backHref="/user"
        />

        {/* Filters */}
        <div className="flex flex-col gap-3 mb-6">
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

        {loading ? (
          <HistorySkeleton />
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <Navigation size={48} className="mb-4 opacity-10" />
            <p className="text-xs font-bold uppercase tracking-widest">{t("no_bookings_found")}</p>
          </div>
        ) : (
          bookings.map((booking) => (
            <Link key={booking.id} href={`/user/booking/${booking.id}`}>
              <Card className="mb-4 overflow-hidden border-none shadow-md hover:shadow-xl transition-all active:scale-[0.98] rounded-[2rem] group">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-slate-100 p-2 rounded-xl text-slate-500">
                        <Calendar size={14} />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <Badge variant="outline" className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border-none ${
                      booking.status === "COMPLETED" ? "bg-primary/10 text-primary-dark" :
                      booking.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {booking.status === "COMPLETED" ? t("completed") : 
                       booking.status === "CANCELLED" ? t("cancelled") : 
                       booking.status === "PICKED_UP" ? t("trip_in_progress") : 
                       booking.status === "ACCEPTED" ? t("accepted") : t("pending")}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <p className="text-xs font-bold text-slate-700 line-clamp-1">{booking.pickupAddress || t("pickup_point")}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                      <p className="text-xs font-medium text-slate-400 line-clamp-1">{booking.destAddress || t("drop_point")}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                       <div className="bg-primary/5 p-1.5 rounded-lg text-primary">
                          <Banknote size={14} />
                       </div>
                       <span className="text-sm font-black text-slate-800">{t("currency")}{booking.fare}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-black text-slate-300 group-hover:text-primary transition-colors uppercase tracking-widest">
                       {t("view_details")} <ChevronRight size={14} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
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
