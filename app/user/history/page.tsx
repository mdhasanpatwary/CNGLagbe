"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Calendar, Banknote, Navigation, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLang } from "@/hooks/useLang";

interface Booking {
  id: string;
  status: string;
  fare: number;
  pickupAddress: string;
  destAddress: string;
  createdAt: string;
  driver?: {
    name: string;
    vehicleNumber?: string;
  } | null;
}

export default function BookingHistoryPage() {
  const { t } = useLang();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/user/bookings");
        if (res.ok) {
          const data = await res.json();
          setBookings(data.bookings);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white p-4 shadow-sm border-b sticky top-0 z-10 flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-black text-slate-800 uppercase tracking-tighter text-xl">
          {t("booking_history")}
        </h1>
      </header>

      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
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
                      booking.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                      booking.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {booking.status}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <p className="text-xs font-bold text-slate-700 line-clamp-1">{booking.pickupAddress || t("pickup_point")}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                      <p className="text-xs font-medium text-slate-400 line-clamp-1">{booking.destAddress || t("drop_point")}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                       <div className="bg-emerald-50 p-1.5 rounded-lg text-emerald-600">
                          <Banknote size={14} />
                       </div>
                       <span className="text-sm font-black text-slate-800">{t("currency")}{booking.fare}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-black text-slate-300 group-hover:text-emerald-500 transition-colors uppercase tracking-widest">
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
