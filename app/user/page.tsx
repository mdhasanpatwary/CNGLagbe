"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { apiFetch } from "@/utils/api";
import { useLang } from "@/hooks/useLang";
import { User } from "@/lib/types/user";
import { Booking } from "@/lib/types/booking";

interface DashboardData {
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
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

const GREETINGS = {
  morning:   { en: "Good morning", bn: "শুভ সকাল" },
  afternoon: { en: "Good afternoon", bn: "শুভ দুপুর" },
  evening:   { en: "Good evening", bn: "শুভ সন্ধ্যা" },
  night:     { en: "Good night", bn: "শুভ রাত্রি" },
};

const TEXT_DASHBOARD = {
  your_dashboard:    { en: "Dashboard", bn: "ড্যাশবোর্ড" },
  book_cng:          { en: "Book CNG", bn: "সিএনজি লাগবে" },
  book_cng_sub:      { en: "Tap to book now", bn: "এখনই বুক করুন" },
  active_ride:       { en: "Active Ride", bn: "চলমান রাইড" },
  view_ride:         { en: "View Ride", bn: "রাইড দেখুন" },
  my_stats:          { en: "My Rides", bn: "আমার রাইড" },
  total_rides:       { en: "Total", bn: "মোট" },
  completed_rides:   { en: "Done", bn: "শেষ" },
  total_km:          { en: "KM", bn: "কিমি" },
  total_spent:       { en: "Spent", bn: "খরচ" },
  recent_rides:      { en: "Recent", bn: "আগের রাইড" },
  see_all:           { en: "All", bn: "সব দেখুন" },
  no_rides_yet:      { en: "No rides yet", bn: "কোন রাইড নেই" },
  no_rides_sub:      { en: "Book your first CNG!", bn: "প্রথম রাইড বুক করুন!" },
  finding_driver:    { en: "Finding Driver", bn: "ড্রাইভার খোঁজা হচ্ছে" },
  driver_coming:     { en: "Driver Coming", bn: "ড্রাইভার আসছে" },
  ride_ongoing:      { en: "Ride Ongoing", bn: "রাইড চলছে" },
};

export default function UserDashboardPage() {
  const { lang } = useLang();
  const t = (key: keyof typeof TEXT_DASHBOARD) =>
    TEXT_DASHBOARD[key][lang as "en" | "bn"] ?? TEXT_DASHBOARD[key]["en"];

  const [user, setUser] = useState<User | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<DashboardData | null>(null);
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
          const bookings: Booking[] = d.bookings ?? [];
          setRecentBookings(bookings.slice(0, 3));

          const completed = bookings.filter((b) => b.status === "COMPLETED");
          const cancelled = bookings.filter((b) => b.status === "CANCELLED");
          const totalDistance = completed.reduce((acc, b) => acc + (b.distance ?? 0), 0);
          const totalSpent = completed.reduce((acc, b) => acc + (b.fare ?? 0), 0);

          setStats({
            totalRides: bookings.length,
            completedRides: completed.length,
            cancelledRides: cancelled.length,
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
  const greeting = GREETINGS[greetingPeriod][lang as "en" | "bn"] ?? GREETINGS[greetingPeriod]["en"];

  const activeStatusLabel = () => {
    if (!activeBooking) return "";
    if (activeBooking.status === "PENDING") return t("finding_driver");
    if (activeBooking.status === "ACCEPTED") return t("driver_coming");
    if (activeBooking.status === "STARTED") return t("ride_ongoing");
    return "";
  };

  const activeStatusColor = () => {
    if (!activeBooking) return "";
    if (activeBooking.status === "PENDING") return "bg-amber-500";
    if (activeBooking.status === "ACCEPTED") return "bg-blue-500";
    return "bg-primary";
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header role="user" theme="light" user={user} />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pb-10 pt-6 space-y-5">

        {/* ── Greeting ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
              {greeting}
            </p>
            <h1 className="text-2xl font-black text-slate-900 mt-0.5 leading-tight">
              {user?.name ?? "—"}
            </h1>
          </div>
          <div className="flex flex-col items-end gap-1 mt-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {t("your_dashboard")}
            </p>
          </div>
        </div>

        {/* ── Active Ride Banner ────────────────────────────────── */}
        {activeBooking && (
          <Link href={`/user/booking/${activeBooking.id}`}>
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl shadow-slate-900/30 active:scale-[0.98] transition-transform">
              {/* Animated glow blob */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/30 rounded-full blur-3xl pointer-events-none" />

              <div className="relative p-5 flex items-center gap-4">
                {/* Pulse icon */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping scale-125" />
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Navigation size={24} className="text-primary" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${activeStatusColor()} animate-pulse`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                      {activeStatusLabel()}
                    </span>
                  </div>
                  <p className="text-base font-black text-white truncate">
                    {t("active_ride")}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">
                    {activeBooking.pickupAddress ?? `${activeBooking.pickupLat.toFixed(4)}, ${activeBooking.pickupLng.toFixed(4)}`}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-sm font-black text-white">৳{activeBooking.fare}</span>
                  <div className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest">
                    {t("view_ride")} <ChevronRight size={12} />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* ── Book CNG CTA ──────────────────────────────────────── */}
        <Link href="/user/map">
          <div className="relative overflow-hidden rounded-3xl bg-primary active:scale-[0.98] transition-transform shadow-xl shadow-primary/30">
            {/* Background decoration */}
            <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-white/10 rounded-full pointer-events-none" />
            <div className="absolute top-4 right-16 w-4 h-4 bg-white/10 rounded-full pointer-events-none" />

            <div className="relative p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
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

              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight size={20} className="text-white" />
              </div>
            </div>
          </div>
        </Link>

        {/* ── Stats Row ─────────────────────────────────────────── */}
        {stats && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                {t("my_stats")}
              </p>
              <TrendingUp size={14} className="text-slate-300" />
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {/* Total */}
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                  {t("total_rides")}
                </p>
                <p className="text-xl font-black text-slate-900">{stats.totalRides}</p>
              </div>

              {/* Completed */}
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-primary mb-1.5">
                  {t("completed_rides")}
                </p>
                <p className="text-xl font-black text-slate-900">{stats.completedRides}</p>
              </div>

              {/* KM */}
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-blue-400 mb-1.5">
                  {t("total_km")}
                </p>
                <p className="text-xl font-black text-slate-900">{stats.totalDistance.toFixed(0)}</p>
              </div>

              {/* Spent */}
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-amber-500 mb-1.5">
                  {t("total_spent")}
                </p>
                <p className="text-xl font-black text-slate-900">৳{stats.totalSpent}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Recent Rides ──────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
              {t("recent_rides")}
            </p>
            <Link
              href="/user/history"
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary"
            >
              {t("see_all")} <ChevronRight size={12} />
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <Route size={28} className="text-slate-200" />
              </div>
              <p className="text-sm font-black text-slate-400">{t("no_rides_yet")}</p>
              <p className="text-[10px] font-bold text-slate-300 mt-1">{t("no_rides_sub")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => {
                const isCompleted = booking.status === "COMPLETED";
                const isCancelled = booking.status === "CANCELLED" || booking.status === "TIMED_OUT";

                return (
                  <Link key={booking.id} href={`/user/booking/${booking.id}`}>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-4 active:scale-[0.98] transition-transform hover:shadow-md">
                      {/* Status icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? "bg-primary/10" : isCancelled ? "bg-red-50" : "bg-amber-50"
                      }`}>
                        {isCompleted
                          ? <CheckCircle2 size={18} className="text-primary" />
                          : isCancelled
                          ? <AlertCircle size={18} className="text-red-400" />
                          : <Clock3 size={18} className="text-amber-500" />
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

                      <ChevronRight size={14} className="text-slate-200 flex-shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Quick Links Row ───────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/user/history">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-3 active:scale-[0.98] transition-transform hover:border-primary/20">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <History size={16} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {lang === "bn" ? "ইতিহাস" : "History"}
                </p>
                <p className="text-xs font-black text-slate-700 truncate">
                  {lang === "bn" ? "সব রাইড" : "All Rides"}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/profile">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-3 active:scale-[0.98] transition-transform hover:border-primary/20">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {user?.photoUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                  : <Navigation size={16} className="text-slate-400" />
                }
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {lang === "bn" ? "অ্যাকাউন্ট" : "Account"}
                </p>
                <p className="text-xs font-black text-slate-700 truncate">
                  {lang === "bn" ? "প্রোফাইল" : "Profile"}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </main>

      <footer className="p-8 text-center opacity-20">
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">CNGLagbe</p>
      </footer>
    </div>
  );
}
