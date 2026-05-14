"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Calendar, Banknote, Navigation, Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLang } from "@/hooks/useLang";
import { Header } from "@/components/layout/Header";
import { PageHeading } from "@/components/ui/PageHeading";
import { apiFetch } from "@/utils/api";

import { Booking } from "@/lib/types/booking";
import { User } from "@/lib/types/user";

export default function BookingHistoryPage() {
  const { t } = useLang();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [historyRes, userRes] = await Promise.all([
          apiFetch("/api/user/bookings"),
          apiFetch("/api/auth/me")
        ]);

        if (historyRes.ok) {
          const data = await historyRes.json();
          setBookings(data.bookings);
        } else {
          console.error("Failed to fetch bookings:", historyRes.status, await historyRes.text());
        }

        if (userRes.ok) {
          const data = await userRes.json();
          setUser(data.user);
        } else {
          console.error("Failed to fetch user:", userRes.status, await userRes.text());
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen premium-bg-surface relative overflow-hidden">
        <div className="absolute inset-0 dot-grid-texture opacity-50 pointer-events-none" />
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4 relative z-10" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] relative z-10">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen premium-bg-surface relative overflow-hidden">
      <div className="absolute inset-0 dot-grid-texture opacity-50 pointer-events-none" />
      <Header 
        role="user"
        theme="light"
        user={user}
      />

      <main className="flex-1 p-6 max-w-md mx-auto w-full space-y-6 relative z-10">
        <PageHeading 
          title={t("booking_history")} 
          subtitle={t("user_portal")}
          backHref="/user"
        />
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <Navigation size={48} className="mb-4 opacity-10" />
            <p className="font-bold uppercase tracking-widest text-xs">{t("no_bookings")}</p>
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
      </main>

      <footer className="p-8 text-center opacity-30">
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">{t("app_name")}</p>
      </footer>
    </div>
  );
}
