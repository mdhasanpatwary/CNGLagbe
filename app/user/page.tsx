"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Navigation,
  History,
  ChevronRight,
  Banknote,
  Route,
  CheckCircle2,
  Clock3,
  Loader2,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  User as UserIcon,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { apiFetch } from "@/utils/api";
import { useLang } from "@/hooks/useLang";
import { User } from "@/lib/types/user";
import { Booking } from "@/lib/types/booking";

interface HomeData {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalDistance: number;
  totalSpent: number;
}

function getTimeOfDayGreeting(): "morning" | "afternoon" | "evening" | "night" {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}

const GREETING_KEYS = {
  morning: "good_morning",
  afternoon: "good_afternoon",
  evening: "good_evening",
  night: "good_night",
} as const;

export default function UserHomePage() {
  const { t } = useLang();

  const [user, setUser] = useState<User | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [userRes, bookingsRes, activeRes] = await Promise.all([
          apiFetch("/api/auth/me"),
          apiFetch("/api/user/bookings"),
          apiFetch("/api/booking/active"),
        ]);

        if (userRes.ok) {
          const d = await userRes.json();
          setUser(d.user);
        }

        if (bookingsRes.ok) {
          const d = await bookingsRes.json();
          // Filter out TIMED_OUT bookings for a cleaner, more premium user experience
          const bookings: Booking[] = (d.bookings ?? []).filter((b: Booking) => b.status !== "TIMED_OUT");
          setRecentBookings(bookings.slice(0, 3));

          const completed = bookings.filter((b) => b.status === "COMPLETED");
          const cancelled = bookings.filter((b) => b.status === "CANCELLED");
          const totalDistance = completed.reduce((acc, b) => acc + (b.distance ?? 0), 0);
          const totalSpent = completed.reduce((acc, b) => acc + (b.fare ?? 0), 0);

          setStats({
            totalBookings: bookings.length,
            completedBookings: completed.length,
            cancelledBookings: cancelled.length,
            totalDistance,
            totalSpent,
          });
        }

        if (activeRes.ok) {
          const d = await activeRes.json();
          if (d.booking) setActiveBooking(d.booking);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-20 h-20 rounded-full bg-primary/20 pulse-ring" />
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <Navigation size={22} className="text-white" />
          </div>
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const greetingPeriod = getTimeOfDayGreeting();
  const greeting = t(GREETING_KEYS[greetingPeriod]);

  const activeStatusLabel = () => {
    if (!activeBooking) return "";
    if (activeBooking.status === "PENDING") return t("finding_driver");
    if (activeBooking.status === "ACCEPTED") return t("driver_arrived");
    return "";
  };

  const activeStatusColor = () => {
    if (!activeBooking) return "";
    if (activeBooking.status === "PENDING") return "bg-amber-500";
    if (activeBooking.status === "ACCEPTED") return "bg-blue-500";
    return "bg-primary";
  };

  return (
    <div className="flex flex-col min-h-screen premium-bg-surface relative overflow-hidden">
      <div className="absolute inset-0 dot-grid-texture opacity-50 pointer-events-none" />
      <Header role="user" theme="light" user={user} />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pb-10 pt-6 space-y-5 relative z-10">

        {/* --- Greeting --- */}
        <section className="flex items-start justify-between mb-2">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
              {greeting}
            </p>
            <h1 className="text-2xl font-black text-slate-900 mt-0.5 leading-tight">
              {user?.name ?? "—"}
            </h1>
          </div>
          <div className="flex flex-col items-end gap-1 mt-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(22,163,74,0.5)]" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {t("dashboard")}
            </p>
          </div>
        </section>

        <div className="space-y-6">
          {/* --- Active Booking Banner --- */}
          {activeBooking && (
            <Link href={`/user/booking/${activeBooking.id}`} className="block group">
              <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl shadow-slate-900/30 active:scale-[0.98] transition-all duration-300 group-hover:shadow-slate-900/40">
                {/* Animated glow blob */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative p-5 flex items-center gap-4">
                  {/* Pulse icon */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping scale-125" />
                    <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center backdrop-blur-sm">
                      <Navigation size={24} className="text-primary" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${activeStatusColor()} animate-pulse shadow-[0_0_5px_currentColor]`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                        {activeStatusLabel()}
                      </span>
                    </div>
                    <p className="text-base font-black text-white truncate">
                      {t("active_booking")}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate max-w-[180px]">
                      {activeBooking.pickupAddress ?? `${activeBooking.pickupLat.toFixed(4)}, ${activeBooking.pickupLng.toFixed(4)}`}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-sm font-black text-white bg-white/10 px-2 py-0.5 rounded-lg border border-white/5">৳{activeBooking.fare}</span>
                    <div className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                      {t("view_details")} <ChevronRight size={12} />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* --- Book CNG CTA --- */}
          <Link href="/user/map" className="block group">
            <div className="relative overflow-hidden rounded-3xl bg-primary active:scale-[0.98] transition-all duration-300 shadow-xl shadow-primary/20 group-hover:shadow-primary/30 group-hover:translate-y-[-2px]">
              {/* Background decoration */}
              <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-white/10 rounded-full pointer-events-none" />
              <div className="absolute top-4 right-16 w-4 h-4 bg-white/10 rounded-full pointer-events-none" />
              <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-white/20 rounded-full" />

              <div className="relative p-6 flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 shadow-inner">
                  {/* CNG icon inline */}
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <path d="M9 17h6" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                    {t("book_cng_sub")}
                  </p>
                  <h2 className="text-2xl font-black text-white leading-tight mt-0.5">
                    {t("book_cng")}
                  </h2>
                </div>

                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <ArrowRight size={20} className="text-white" />
                </div>
              </div>
            </div>
          </Link>

          {/* --- Stats Section --- */}
          {stats && (
            <section className="relative p-5 rounded-[2.5rem] bg-gradient-to-b from-white/80 to-slate-50/40 backdrop-blur-md border border-white/60 shadow-sm transition-all duration-500">
              <div className="flex items-center justify-between mb-4 px-1">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                  {t("my_bookings")}
                </p>
                <TrendingUp size={14} className="text-primary/40" />
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                <div className="bg-white/80 rounded-2xl p-3 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center text-center hover:scale-105 transition-transform">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                    {t("total")}
                  </p>
                  <p className="text-xl font-black text-slate-900">{stats.totalBookings}</p>
                </div>

                <div className="bg-white/80 rounded-2xl p-3 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center text-center hover:scale-105 transition-transform">
                  <p className="text-[8px] font-black uppercase tracking-widest text-primary mb-1.5">
                    {t("completed")}
                  </p>
                  <p className="text-xl font-black text-slate-900">{stats.completedBookings}</p>
                </div>

                <div className="bg-white/80 rounded-2xl p-3 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center text-center hover:scale-105 transition-transform">
                  <p className="text-[8px] font-black uppercase tracking-widest text-blue-400 mb-1.5">
                    {t("km_unit")}
                  </p>
                  <p className="text-xl font-black text-slate-900">{stats.totalDistance.toFixed(0)}</p>
                </div>

                <div className="bg-white/80 rounded-2xl p-3 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center text-center hover:scale-105 transition-transform">
                  <p className="text-[8px] font-black uppercase tracking-widest text-amber-500 mb-1.5">
                    {t("spent")}
                  </p>
                  <p className="text-xl font-black text-slate-900">৳{stats.totalSpent}</p>
                </div>
              </div>
            </section>
          )}

          {/* --- Recent Bookings --- */}
          <section className="relative p-5 rounded-[2.5rem] bg-gradient-to-b from-white/80 to-slate-50/40 backdrop-blur-md border border-white/60 shadow-sm transition-all duration-500">
            <div className="flex items-center justify-between mb-4 px-1">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                {t("recent_bookings")}
              </p>
              <Link
                href="/user/history"
                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-80 transition-opacity"
              >
                {t("all")} <ChevronRight size={12} />
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <div className="bg-white/60 rounded-3xl p-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100 shadow-inner">
                  <Route size={28} className="text-slate-200" />
                </div>
                <p className="text-sm font-black text-slate-400">{t("no_bookings")}</p>
                <p className="text-[10px] font-bold text-slate-300 mt-1">{t("no_bookings_sub")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking) => {
                  const isCompleted = booking.status === "COMPLETED";
                  const isCancelled = booking.status === "CANCELLED" || booking.status === "TIMED_OUT";

                  return (
                    <Link key={booking.id} href={`/user/booking/${booking.id}`} className="block group">
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-4 active:scale-[0.98] transition-all duration-300 hover:shadow-md hover:border-primary/10">
                        {/* Status icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          isCompleted ? "bg-primary/10 text-primary" : isCancelled ? "bg-red-50 text-red-400" : "bg-amber-50 text-amber-500"
                        }`}>
                          {isCompleted
                            ? <CheckCircle2 size={18} />
                            : isCancelled
                            ? <AlertCircle size={18} />
                            : <Clock3 size={18} />
                          }
                        </div>

                        {/* Route info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <MapPin size={10} className="text-primary flex-shrink-0" />
                            <p className="text-xs font-black text-slate-700 truncate">
                              {booking.pickupAddress ?? "Pickup"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin size={10} className="text-slate-300 flex-shrink-0" />
                            <p className="text-[10px] font-bold text-slate-400 truncate">
                              {booking.destAddress ?? "Drop"}
                            </p>
                          </div>
                        </div>

                        {/* Fare + chevron */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <div className="flex items-center gap-1">
                            <Banknote size={12} className="text-primary" />
                            <span className="text-sm font-black text-slate-900">৳{booking.fare}</span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                            {booking.distance.toFixed(1)} km
                          </span>
                        </div>

                        <ChevronRight size={14} className="text-slate-200 flex-shrink-0 group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* --- Quick Links Row --- */}
          <section className="relative pt-2">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Link href="/user/history" className="block group">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-3 active:scale-[0.98] transition-all duration-300 hover:border-primary/20 hover:shadow-md">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
                    <History size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {t("history")}
                    </p>
                    <p className="text-xs font-black text-slate-700 truncate">
                      {t("all_bookings")}
                    </p>
                  </div>
                </div>
              </Link>

              <Link href="/profile" className="block group">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-3 active:scale-[0.98] transition-all duration-300 hover:border-primary/20 hover:shadow-md">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-100">
                    {user?.photoUrl
                      ? (
                          <Image 
                            src={user.photoUrl} 
                            alt={user.name ?? ""} 
                            width={36}
                            height={36}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          />
                        )
                      : <UserIcon size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {t("account")}
                    </p>
                    <p className="text-xs font-black text-slate-700 truncate">
                      {t("profile")}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </section>
        </div>
      </main>

      <footer className="py-12 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-slate-200 rounded-full" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">CNGLagbe</p>
        <p className="text-[8px] font-bold text-slate-200 mt-2 tracking-widest italic">PREMIUM CNG BOOKING</p>
      </footer>
    </div>
  );
}
