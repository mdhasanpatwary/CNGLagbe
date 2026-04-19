"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, Users, Activity, Banknote } from "lucide-react";

interface Stats {
  totalBookings: number;
  completedBookings: number;
  totalRevenue: number;
  adminCommission: number;
  activeDrivers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
         const [resStats, resBookings] = await Promise.all([
           fetch("/api/admin/stats"),
           fetch("/api/admin/bookings?limit=50")
         ]);
         
         const dataStats = await resStats.json();
         const dataBookings = await resBookings.json();
         
         setStats(dataStats.stats);
         setBookings(dataBookings.bookings);
      } catch (e) {
         console.error(e);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-slate-900 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-2">
             <LayoutDashboard className="text-emerald-400" />
             <h1 className="text-xl font-bold tracking-tight">CNGLagbe Admin</h1>
           </div>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Platform Overview</h2>
        
        {stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-slate-500 font-medium">Total Revenue</p>
                  <Banknote className="text-emerald-500" />
                </div>
                <h3 className="text-3xl font-extrabold text-slate-800">৳{stats.totalRevenue}</h3>
                <p className="text-sm text-slate-500 mt-2">from completed rides</p>
             </div>
             
             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-b-4 border-b-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-slate-500 font-medium">Commission (10%)</p>
                  <Banknote className="text-blue-500" />
                </div>
                <h3 className="text-3xl font-extrabold text-blue-600">৳{stats.adminCommission}</h3>
                <p className="text-sm text-slate-500 mt-2">platform cut</p>
             </div>

             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-slate-500 font-medium">Completed Rides</p>
                  <Activity className="text-indigo-500" />
                </div>
                <h3 className="text-3xl font-extrabold text-slate-800">{stats.completedBookings} <span className="text-lg text-slate-400 font-normal">/ {stats.totalBookings}</span></h3>
                <p className="text-sm text-slate-500 mt-2">total bookings</p>
             </div>

             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-slate-500 font-medium">Online Drivers</p>
                  <Users className="text-amber-500" />
                </div>
                <h3 className="text-3xl font-extrabold text-slate-800">{stats.activeDrivers}</h3>
                <p className="text-sm text-slate-500 mt-2">currently available</p>
             </div>
          </div>
        ) : (
          <div className="animate-pulse flex space-x-4 mb-8">
            <div className="h-32 bg-slate-200 rounded w-full"></div>
            <div className="h-32 bg-slate-200 rounded w-full"></div>
            <div className="h-32 bg-slate-200 rounded w-full"></div>
            <div className="h-32 bg-slate-200 rounded w-full"></div>
          </div>
        )}

        <h2 className="text-xl font-bold text-slate-800 mb-4">Recent Bookings</h2>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                      <th className="p-4 font-semibold border-b">ID</th>
                      <th className="p-4 font-semibold border-b">Distance</th>
                      <th className="p-4 font-semibold border-b">Fare</th>
                      <th className="p-4 font-semibold border-b">Status</th>
                      <th className="p-4 font-semibold border-b">Driver</th>
                      <th className="p-4 font-semibold border-b">Time</th>
                   </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                   {bookings.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50 transition">
                         <td className="p-4 font-mono text-slate-600">#{b.id.slice(-6).toUpperCase()}</td>
                         <td className="p-4">{b.distance} km</td>
                         <td className="p-4 font-bold text-slate-800">৳{b.fare}</td>
                         <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              b.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                              b.status === "ACCEPTED" ? "bg-blue-100 text-blue-700" :
                              "bg-amber-100 text-amber-700"
                            }`}>
                               {b.status}
                            </span>
                         </td>
                         <td className="p-4 text-slate-600">{b.driver ? b.driver.name : "Unassigned"}</td>
                         <td className="p-4 text-slate-500">{new Date(b.createdAt).toLocaleString()}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
             {bookings.length === 0 && (
                <div className="p-8 text-center text-slate-500">No bookings found.</div>
             )}
          </div>
        </div>
      </main>
    </div>
  );
}
