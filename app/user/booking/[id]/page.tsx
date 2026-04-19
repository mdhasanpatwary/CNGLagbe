"use client";

import { useEffect, useState, use } from "react";
import { Loader2, CheckCircle2, User as UserIcon, Phone, MapPin, Search } from "lucide-react";
import Link from "next/link";

interface Booking {
  id: string;
  status: "PENDING" | "ACCEPTED" | "COMPLETED" | "CANCELLED";
  fare: number;
  driver?: {
    name: string;
    phone: string;
  } | null;
}

export default function UserBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/booking/${id}`);
        if (!res.ok) throw new Error("Booking not found");
        const data = await res.json();
        setBooking(data.booking);

        if (data.booking.status === "COMPLETED" || data.booking.status === "CANCELLED") {
           clearInterval(intervalId);
        }
      } catch (err: any) {
        setError(err.message);
        clearInterval(intervalId);
      }
    };

    fetchBooking();
    // Poll every 5 seconds for status updates
    intervalId = setInterval(fetchBooking, 5000);

    return () => clearInterval(intervalId);
  }, [id]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-screen text-center">
        <div className="bg-red-100 text-red-500 rounded-full p-4 mb-4">
           {/* Simple error icon */}
           <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <Link href="/" className="btn-secondary inline-block">Return Home</Link>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
        <p className="text-slate-500 font-medium">Loading booking details...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white p-4 shadow-sm border-b flex items-center justify-between">
        <h1 className="font-bold text-slate-800">Booking #{id.slice(-6).toUpperCase()}</h1>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          booking.status === "PENDING" ? "bg-amber-100 text-amber-700" :
          booking.status === "ACCEPTED" ? "bg-blue-100 text-blue-700" :
          "bg-emerald-100 text-emerald-700"
        }`}>
          {booking.status}
        </div>
      </header>
      
      <main className="flex-1 p-6 max-w-md mx-auto w-full">
        
        {/* Status Graphic */}
        <div className="flex flex-col items-center justify-center py-8">
          {booking.status === "PENDING" && (
            <>
              <div className="relative">
                <div className="absolute inset-0 rounded-full animate-ping bg-emerald-400 opacity-20"></div>
                <div className="bg-emerald-100 p-6 rounded-full relative">
                  <Search className="w-12 h-12 text-emerald-600 animate-pulse" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mt-6 mb-2">Looking for Drivers</h2>
              <p className="text-slate-500 text-center text-sm px-4">Contacting nearby available drivers. Please wait...</p>
            </>
          )}

          {booking.status === "ACCEPTED" && (
            <>
              <div className="bg-blue-100 p-6 rounded-full">
                <CheckCircle2 className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold mt-6 mb-2">Driver Accepted!</h2>
              <p className="text-slate-500 text-center text-sm px-4">Your driver is on the way. Meet them at the pickup point.</p>
            </>
          )}

          {booking.status === "COMPLETED" && (
            <>
              <div className="bg-emerald-100 p-6 rounded-full">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold mt-6 mb-2">Ride Completed</h2>
              <p className="text-slate-500 text-center text-sm px-4">Hope you had a safe journey!</p>
            </>
          )}
        </div>

        {/* Driver Card */}
        {(booking.status === "ACCEPTED" || booking.status === "COMPLETED") && booking.driver && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-6">
             <div className="flex items-center gap-4 border-b border-slate-100 pb-4 mb-4">
                <div className="bg-slate-100 p-3 rounded-full">
                  <UserIcon className="w-6 h-6 text-slate-500" />
                </div>
                <div>
                   <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Your Driver</p>
                   <h3 className="font-bold text-lg text-slate-800">{booking.driver.name}</h3>
                </div>
             </div>
             <a href={`tel:${booking.driver.phone}`} className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-3 rounded-lg font-medium hover:bg-emerald-100 transition">
                <Phone className="w-4 h-4" />
                Call Driver {booking.driver.phone}
             </a>
          </div>
        )}

        {/* Fare Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
           <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Fixed Fare</p>
           <h3 className="text-3xl font-extrabold text-emerald-600 flex items-baseline gap-1">
             ৳{booking.fare} <span className="text-sm font-medium text-slate-500">BDT</span>
           </h3>
        </div>
        
        {booking.status === "COMPLETED" && (
           <Link href="/" className="btn-primary mt-6 block text-center">Book Another Ride</Link>
        )}

      </main>
    </div>
  );
}
