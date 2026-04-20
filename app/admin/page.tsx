"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, Users, UserCheck, TrendingUp, HandCoins, Banknote, Route } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLang } from "@/hooks/useLang";

  interface PendingDriver {
    id: string;
    name: string;
    phone: string;
    nidNumber?: string;
    licenseNumber?: string;
    vehicleNumber?: string;
    createdAt: string;
  }

  const [pendingDrivers, setPendingDrivers] = useState<PendingDriver[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
         const [resStats, resBookings, resDrivers] = await Promise.all([
           fetch("/api/admin/stats"),
           fetch("/api/admin/bookings?limit=50"),
           fetch("/api/admin/drivers/approve")
         ]);
         
         const dataStats = await resStats.json();
         const dataBookings = await resBookings.json();
         const dataDrivers = await resDrivers.json();
         
         setStats(dataStats.stats);
         setBookings(dataBookings.bookings);
         setPendingDrivers(dataDrivers.drivers || []);
      } catch (e) {
         console.error(e);
      }
    };
    fetchData();
  }, []);

  const handleApprove = async (driverId: string) => {
    try {
      const res = await fetch("/api/admin/drivers/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, action: "approve" })
      });
      if (res.ok) {
        setPendingDrivers(prev => prev.filter(d => d.id !== driverId));
        // Refresh stats to show new active driver
        const resStats = await fetch("/api/admin/stats");
        const dataStats = await resStats.json();
        setStats(dataStats.stats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-2">
             <LayoutDashboard className="text-emerald-400" />
             <h1 className="text-xl font-bold tracking-tight">{t("app_name")} {t("admin_dashboard")}</h1>
           </div>
           <LanguageSwitcher />
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 mt-6">
        
        {/* Top metrics */}
        {stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-xs font-medium uppercase tracking-wider text-slate-500">{t("total_revenue")}</CardTitle>
                   <TrendingUp className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                   <div className="text-2xl font-bold flex items-center gap-1"><Banknote className="text-emerald-600" /> {t("currency")}{stats.revenue?.total ?? 0}</div>
                   <p className="text-xs text-slate-500">{t("revenue_desc")}</p>
                </CardContent>
             </Card>

             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-xs font-medium uppercase tracking-wider text-slate-500">{t("admin_commission")}</CardTitle>
                   <HandCoins className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                   <div className="text-2xl font-bold flex items-center gap-1"><Banknote className="text-emerald-600" /> {t("currency")}{stats.revenue?.commission ?? 0}</div>
                   <p className="text-xs text-slate-500">{t("commission_desc")}</p>
                </CardContent>
             </Card>

             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-xs font-medium uppercase tracking-wider text-slate-500">{t("driver_payouts")}</CardTitle>
                   <UserCheck className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                   <div className="text-2xl font-bold flex items-center gap-1"><Banknote className="text-emerald-600" /> {t("currency")}{stats.revenue?.driverPayout ?? 0}</div>
                   <p className="text-xs text-slate-500">{t("payout_desc")}</p>
                </CardContent>
             </Card>

             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-xs font-medium uppercase tracking-wider text-slate-500">{t("active_drivers")}</CardTitle>
                   <Users className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                   <div className="text-2xl font-bold">{stats.activeDrivers ?? 0}</div>
                   <p className="text-xs text-slate-500 flex items-center gap-1">{t("assigned_desc")}: {stats.bookings?.pending ?? 0}</p>
                </CardContent>
             </Card>
          </div>
        ) : (
          <div className="animate-pulse flex space-x-4 mb-8">
            <div className="h-32 bg-slate-200 rounded w-full"></div>
            <div className="h-32 bg-slate-200 rounded w-full"></div>
            <div className="h-32 bg-slate-200 rounded w-full"></div>
            <div className="h-32 bg-slate-200 rounded w-full"></div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Drivers */}
          <div className="lg:col-span-1">
             <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <UserCheck className="text-emerald-500" />
                    {t("pending_drivers")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingDrivers.map((driver) => (
                      <div key={driver.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                         <div className="flex justify-between items-start">
                            <div>
                               <p className="font-bold text-slate-800">{driver.name}</p>
                               <p className="text-xs text-slate-500">{driver.phone}</p>
                            </div>
                            <Badge variant="outline" className="text-[10px] uppercase font-black tracking-tighter">NEW</Badge>
                         </div>
                         <div className="grid grid-cols-1 gap-1">
                            <p className="text-[10px] text-slate-400 uppercase font-black">{t("nid_number")}: <span className="text-slate-600">{driver.nidNumber || "N/A"}</span></p>
                            <p className="text-[10px] text-slate-400 uppercase font-black">{t("license_number")}: <span className="text-slate-600">{driver.licenseNumber || "N/A"}</span></p>
                            <p className="text-[10px] text-slate-400 uppercase font-black">{t("vehicle_number")}: <span className="text-slate-600">{driver.vehicleNumber || "N/A"}</span></p>
                         </div>
                         <Button onClick={() => handleApprove(driver.id)} className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold uppercase tracking-widest rounded-lg">
                           {t("approve_btn")}
                         </Button>
                      </div>
                    ))}
                    {pendingDrivers.length === 0 && (
                      <div className="py-10 text-center text-xs text-slate-400 italic">
                        {t("no_bookings")}
                      </div>
                    )}
                  </div>
                </CardContent>
             </Card>
          </div>

          {/* Recent Bookings Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold">{t("recent_bookings")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-slate-100 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs font-bold uppercase">{t("id")}</TableHead>
                        <TableHead className="text-xs font-bold uppercase">{t("status")}</TableHead>
                        <TableHead className="text-xs font-bold uppercase flex items-center gap-1 whitespace-nowrap"><Route size={12} /> {t("distance")}</TableHead>
                        <TableHead className="text-xs font-bold uppercase flex items-center gap-1 whitespace-nowrap"><Banknote size={12} /> {t("total_fare")}</TableHead>
                        <TableHead className="text-xs font-bold uppercase flex items-center gap-1 whitespace-nowrap"><Banknote size={12} /> {t("driver_payout")}</TableHead>
                        <TableHead className="text-xs font-bold uppercase flex items-center gap-1 whitespace-nowrap"><Banknote size={12} /> {t("commission")}</TableHead>
                        <TableHead className="text-right text-xs font-bold uppercase">{t("date")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="font-medium text-xs text-slate-400">{booking.id.slice(-6)}</TableCell>
                          <TableCell>
                             <Badge variant={
                               booking.status === "COMPLETED" ? "default" :
                               booking.status === "ACCEPTED" ? "secondary" : "outline"
                             } className="text-[10px] font-bold">
                               {booking.status}
                             </Badge>
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{booking.distance} {t("km_unit")}</TableCell>
                          <TableCell className="font-bold text-xs text-slate-900 whitespace-nowrap">{t("currency")}{booking.fare}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{t("currency")}{Math.floor(booking.fare * 0.8)}</TableCell>
                          <TableCell className="text-emerald-600 font-bold text-xs whitespace-nowrap">{t("currency")}{Math.ceil(booking.fare * 0.2)}</TableCell>
                          <TableCell className="text-right text-xs text-slate-500 whitespace-nowrap">{new Date(booking.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                      {bookings.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-xs text-slate-500 py-10 italic">
                            {t("no_bookings")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
