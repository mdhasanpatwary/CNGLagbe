"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, TrendingUp, HandCoins, Banknote, Route, RefreshCcw, MapPin, Activity, ShieldAlert, History, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppButton } from "@/components/ui/AppButton";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLang } from "@/hooks/useLang";

interface AdminStats {
  revenue?: {
    total: number;
    voided: number;
    commission: number;
    driverPayout: number;
  };
  activeDrivers?: number;
  bookings?: {
    pending: number;
  };
}

interface AdminBooking {
  id: string;
  status: string;
  distance: number;
  fare: number;
  createdAt: string;
  pickupAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  driver?: {
    name: string;
    phone: string;
  };
}

interface AdminDriver {
  id: string;
  name: string;
  phone: string;
  photoUrl?: string;
  nidNumber?: string;
  licenseNumber?: string;
  vehicleNumber?: string;
  isApproved: boolean;
  isSuspended: boolean;
  updatedAt: string;
}

interface AdminUser {
  id: string;
  phone: string;
  name?: string;
  role: string;
  bookingCount: number;
  createdAt: string;
}

const formatDate = (date: string | Date, t: (key: string) => string, includeDate = false) => {
  if (!date) return t("just_now");
  const d = new Date(date);
  if (isNaN(d.getTime())) return t("just_now");
  
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (!includeDate) return timeStr;
  
  return `${d.toLocaleDateString()} ${timeStr}`;
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-red-100 text-red-700 border-red-200",
    TIMED_OUT: "bg-amber-100 text-amber-700 border-amber-200",
    PENDING: "bg-blue-100 text-blue-700 border-blue-200",
    ASSIGNED: "bg-blue-50 text-blue-600 border-blue-100",
    ACCEPTED: "bg-blue-50 text-blue-600 border-blue-100",
  };

  const style = styles[status] || "bg-slate-100 text-slate-600 border-slate-200";
  
  return (
    <div className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full h-6 text-[10px] font-bold border ${style}`}>
      {status}
    </div>
  );
};

export default function AdminPage() {
  const { t } = useLang();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [activeBookings, setActiveBookings] = useState<AdminBooking[]>([]);
  const [onlineDrivers, setOnlineDrivers] = useState<AdminDriver[]>([]);
  const [allDrivers, setAllDrivers] = useState<AdminDriver[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "drivers" | "users" | "logs">("overview");
  const [isRefreshing, setIsRefreshing] = useState(true);
  
  // Sorting & Pagination state
  const [sortConfig, setSortConfig] = useState<{ key: keyof AdminBooking | "fee" | "driver_payout"; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handleSort = (key: keyof AdminBooking | "fee" | "driver_payout") => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedBookings = [...bookings].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    let aVal: string | number | undefined = a[key as keyof AdminBooking];
    let bVal: string | number | undefined = b[key as keyof AdminBooking];
    
    if (key === "fee") {
      aVal = a.fare * 0.2;
      bVal = b.fare * 0.2;
    } else if (key === "driver_payout") {
      aVal = a.fare * 0.8;
      bVal = b.fare * 0.8;
    } else if (key === "driver") {
      aVal = a.driver?.name || "";
      bVal = b.driver?.name || "";
    }

    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedBookings = sortedBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(bookings.length / itemsPerPage);

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

  const fetchData = async (options?: { showLoading?: boolean }) => {
    if (options?.showLoading) setIsRefreshing(true);
    try {
       const [resStats, resBookings, resDrivers, resActive, resOnline, resAllDrivers, resAllUsers] = await Promise.all([
         fetch("/api/admin/stats"),
         fetch("/api/admin/bookings?limit=50"),
         fetch("/api/admin/drivers/approve"),
         fetch("/api/admin/bookings?type=active"),
         fetch("/api/admin/drivers/online"),
         fetch("/api/admin/drivers?limit=100"),
         fetch("/api/admin/users?limit=100")
       ]);
       
       const dataStats = await resStats.json();
       const dataBookings = await resBookings.json();
       const dataDrivers = await resDrivers.json();
       const dataActive = await resActive.json();
       const dataOnline = await resOnline.json();
       const dataAllDrivers = await resAllDrivers.json();
       const dataAllUsers = await resAllUsers.json();
       
       setStats(dataStats.stats);
       setBookings(dataBookings.bookings);
       setPendingDrivers(dataDrivers.drivers || []);
       setActiveBookings(dataActive.bookings || []);
       setOnlineDrivers(dataOnline.drivers || []);
       setAllDrivers(dataAllDrivers.drivers || []);
       setAllUsers(dataAllUsers.users || []);
    } catch (e: unknown) {
       console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchData({ showLoading: false }));
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

  const handleToggleSuspend = async (driverId: string, currentlySuspended: boolean) => {
    try {
       const action = currentlySuspended ? "unsuspend" : "suspend";
       const res = await fetch("/api/admin/drivers/suspend", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ driverId, action })
       });
       if (res.ok) {
         fetchData({ showLoading: true }); // Refresh everything
       }
    } catch (e) {
       console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 shadow-2xl sticky top-0 z-50 backdrop-blur-lg bg-opacity-90">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-3 group cursor-pointer">
             <div className="bg-emerald-500/20 p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">
               <Users className="text-emerald-400" size={24} />
             </div>
             <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
               {t("app_name")} <span className="text-emerald-400 font-medium text-lg ml-1 opacity-80">{t("admin_dashboard")}</span>
             </h1>
           </div>
            <div className="flex items-center gap-4">
                <AppButton 
                  onClick={() => fetchData({ showLoading: true })} 
                  disabled={isRefreshing}
                  variant="ghost"
                  className="bg-white/5 hover:bg-white/10 border border-white/10 px-5 text-white font-bold transition-all rounded-xl"
                  leftIcon={<RefreshCcw size={16} className={isRefreshing ? "animate-spin" : ""} />}
                >
                  {t("refresh_status")}
                </AppButton>
               <LanguageSwitcher />
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8">
        
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-10 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-slate-200/50 w-fit relative">
           {[
             { id: "overview", label: t("overview"), icon: Activity },
             { id: "drivers", label: t("drivers"), icon: Users },
             { id: "users", label: t("users"), icon: UserCheck },
             { id: "logs", label: t("logs"), icon: History }
           ].map((tab) => (
              <AppButton
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "overview" | "drivers" | "users" | "logs")}
                variant={activeTab === tab.id ? "primary" : "ghost"}
                className={`relative px-6 h-11 flex items-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 z-10 ${
                  activeTab === tab.id 
                    ? "text-white bg-slate-900 shadow-lg shadow-slate-900/20" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
                }`}
              >
                <tab.icon size={14} className={activeTab === tab.id ? "text-emerald-400" : ""} />
                {tab.label}
              </AppButton>
           ))}
        </div>

        {activeTab === "overview" && (
          <>
            {/* Top metrics */}
            {stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
             <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("total_revenue")}</CardTitle>
                   <div className="bg-emerald-100 p-2 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                   </div>
                </CardHeader>
                <CardContent>
                   <div className="text-3xl font-black flex items-center gap-1.5 text-slate-900">
                     <span className="text-emerald-500 text-lg">{t("currency")}</span>
                     {stats.revenue?.total ?? 0}
                   </div>
                   <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{t("revenue_desc")}</p>
                   {stats.revenue?.voided ? (
                     <p className="text-[10px] text-red-500 font-black mt-2 bg-red-50 w-fit px-2 py-0.5 rounded-md uppercase border border-red-100">
                       {t("voided_revenue")}: {t("currency")}{stats.revenue.voided}
                     </p>
                   ) : null}
                </CardContent>
             </Card>

             <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("admin_commission")}</CardTitle>
                   <div className="bg-blue-100 p-2 rounded-lg">
                    <HandCoins className="h-4 w-4 text-blue-600" />
                   </div>
                </CardHeader>
                <CardContent>
                   <div className="text-3xl font-black flex items-center gap-1.5 text-slate-900">
                     <span className="text-blue-500 text-lg">{t("currency")}</span>
                     {stats.revenue?.commission ?? 0}
                   </div>
                   <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{t("commission_desc")}</p>
                </CardContent>
             </Card>

             <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("driver_payouts")}</CardTitle>
                   <div className="bg-purple-100 p-2 rounded-lg">
                    <UserCheck className="h-4 w-4 text-purple-600" />
                   </div>
                </CardHeader>
                <CardContent>
                   <div className="text-3xl font-black flex items-center gap-1.5 text-slate-900">
                     <span className="text-purple-500 text-lg">{t("currency")}</span>
                     {stats.revenue?.driverPayout ?? 0}
                   </div>
                   <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{t("payout_desc")}</p>
                </CardContent>
             </Card>

             <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("active_drivers")}</CardTitle>
                   <div className="bg-amber-100 p-2 rounded-lg">
                    <Users className="h-4 w-4 text-amber-600" />
                   </div>
                </CardHeader>
                <CardContent>
                   <div className="text-3xl font-black text-slate-900">{stats.activeDrivers ?? 0}</div>
                   {bookings.filter(b => b.status === "TIMED_OUT").length > 0 ? (
                     <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-tight flex items-center gap-1">
                        {bookings.filter(b => b.status === "TIMED_OUT").length} {t("needs_review")}
                     </p>
                   ) : (
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight flex items-center gap-1">
                      {t("assigned_desc")}: <span className="text-amber-600">{stats.bookings?.pending ?? 0}</span>
                    </p>
                   )}
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
        
        {/* Live Monitoring Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
           {/* Active Bookings Monitoring */}
           <Card className="border-none shadow-lg bg-white overflow-hidden">
              <CardHeader className="bg-emerald-50/50 border-b border-emerald-50">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-emerald-700">
                  <Activity size={18} />
                  {t("active_bookings")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="max-h-80 overflow-y-auto">
                    {activeBookings.length > 0 ? (
                       <div className="divide-y divide-slate-50">
                          {activeBookings.map((b) => (
                             <div key={b.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between">
                                <div>
                                   <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-[9px] font-black">{b.id.slice(-6).toUpperCase()}</Badge>
                                       <StatusBadge status={b.status} />
                                   </div>
                                   <p className="text-xs text-slate-600 font-medium truncate max-w-[200px]">{b.pickupAddress || `${b.pickupLat}, ${b.pickupLng}`}</p>
                                </div>
                                <div className="text-right">
                                   <p className="font-bold text-sm text-slate-800">{t("currency")}{b.fare}</p>
                                   <p className="text-[10px] text-slate-400 uppercase font-black">{b.distance} {t("km_unit")}</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-50/50 rounded-xl m-4 border-2 border-dashed border-slate-100">
                           <div className="bg-white p-3 rounded-2xl shadow-sm">
                             <Activity size={24} className="text-slate-200" />
                           </div>
                           <div className="text-center">
                             <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">{t("no_active_rides_online")}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase">{onlineDrivers.length} {t("online_drivers")} {t("waiting")}</p>
                           </div>
                        </div>
                    )}
                 </div>
              </CardContent>
           </Card>

           {/* Online Drivers Monitoring */}
           <Card className="border-none shadow-lg bg-white overflow-hidden">
              <CardHeader className="bg-blue-50/50 border-b border-blue-50">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-blue-700">
                  <Users size={18} />
                  {t("online_drivers")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="max-h-80 overflow-y-auto">
                    {onlineDrivers.length > 0 ? (
                       <div className="divide-y divide-slate-50">
                          {onlineDrivers.map((d) => (
                             <div key={d.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                      {d.name.slice(0, 2).toUpperCase()}
                                   </div>
                                   <div>
                                      <p className="font-bold text-sm text-slate-800">{d.name}</p>
                                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-black uppercase">
                                         <MapPin size={10} />
                                         {d.vehicleNumber || "No plate"}
                                      </div>
                                   </div>
                                </div>
                                 <div className="text-right flex flex-col items-end gap-1">
                                    {!d.isApproved ? (
                                      <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md border border-amber-100">
                                         <ShieldAlert size={10} />
                                         <span className="text-[9px] font-black uppercase">{t("pending")}</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-end gap-1 mb-1">
                                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                         <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">{t("online")}</span>
                                      </div>
                                    )}
                                    {!d.vehicleNumber && (
                                      <span className="text-[8px] font-black text-red-500 uppercase bg-red-50 px-1 rounded">No Plate</span>
                                    )}
                                    <p className="text-[9px] text-slate-400 font-medium">
                                       {formatDate(d.updatedAt, t)}
                                    </p>
                                 </div>
                             </div>
                          ))}
                       </div>
                    ) : (
                       <div className="py-12 text-center text-slate-400 italic text-sm">
                          {t("no_online_drivers")}
                       </div>
                    )}
                 </div>
              </CardContent>
           </Card>
        </div>

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
                    {pendingDrivers.map((driver) => {
                      const isIncomplete = !driver.nidNumber || !driver.licenseNumber || !driver.vehicleNumber;
                      const missingFields = [];
                      if (!driver.nidNumber) missingFields.push(t("nid_number"));
                      if (!driver.licenseNumber) missingFields.push(t("license_number"));
                      if (!driver.vehicleNumber) missingFields.push(t("vehicle_number"));

                      return (
                        <div key={driver.id} className={`p-4 rounded-xl border ${isIncomplete ? "border-red-200 bg-red-50/30" : "border-slate-100 bg-slate-50/50"} space-y-3`}>
                           <div className="flex justify-between items-start">
                              <div>
                                 <p className="font-bold text-slate-800">{driver.name}</p>
                                 <p className="text-xs text-slate-500">{driver.phone}</p>
                              </div>
                              <Badge variant="outline" className="text-[10px] uppercase font-black tracking-tighter">{t("new_label")}</Badge>
                           </div>
                           <div className="grid grid-cols-1 gap-1">
                              <p className="text-[10px] text-slate-400 uppercase font-black">{t("nid_number")}: <span className={driver.nidNumber ? "text-slate-600" : "text-red-500 font-bold"}>{driver.nidNumber || t("unassigned")}</span></p>
                              <p className="text-[10px] text-slate-400 uppercase font-black">{t("license_number")}: <span className={driver.licenseNumber ? "text-slate-600" : "text-red-500 font-bold"}>{driver.licenseNumber || t("unassigned")}</span></p>
                              <p className="text-[10px] text-slate-400 uppercase font-black">{t("vehicle_number")}: <span className={driver.vehicleNumber ? "text-slate-600" : "text-red-500 font-bold"}>{driver.vehicleNumber || t("unassigned")}</span></p>
                           </div>
                            {isIncomplete && (
                              <div className="py-2.5 px-3 bg-red-50 text-red-600 rounded-xl border border-red-100 space-y-1">
                                <div className="flex items-center gap-2">
                                  <ShieldAlert size={14} className="shrink-0" />
                                  <p className="text-[10px] font-black uppercase tracking-tight">
                                    {t("incomplete_profile_warning")}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-1 pl-5">
                                  {missingFields.map(field => (
                                    <span key={field} className="text-[8px] bg-red-100 px-1.5 py-0.5 rounded font-black uppercase">{field}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                             <AppButton 
                               onClick={() => handleApprove(driver.id)} 
                               disabled={isIncomplete}
                               className={`w-full h-10 ${isIncomplete ? "bg-slate-200 text-slate-400 grayscale" : "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"} text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300`}
                             >
                               {t("approve_btn")}
                             </AppButton>
                        </div>
                      );
                    })}
                    {pendingDrivers.length === 0 && (
                      <div className="py-10 text-center text-xs text-slate-400 italic">
                        {t("no_pending_drivers")}
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
                        <TableHead onClick={() => handleSort("id")} className="text-xs font-bold uppercase cursor-pointer hover:bg-slate-100 transition">
                          {t("id")}
                        </TableHead>
                        <TableHead onClick={() => handleSort("status")} className="text-xs font-bold uppercase cursor-pointer hover:bg-slate-100 transition">
                          {t("status")}
                        </TableHead>
                        <TableHead onClick={() => handleSort("distance")} className="text-xs font-bold uppercase cursor-pointer hover:bg-slate-100 transition whitespace-nowrap">
                          <div className="flex items-center gap-1"><Route size={12} /> {t("distance")}</div>
                        </TableHead>
                        <TableHead onClick={() => handleSort("fare")} className="text-xs font-bold uppercase cursor-pointer hover:bg-slate-100 transition whitespace-nowrap">
                          <div className="flex items-center gap-1"><Banknote size={12} /> {t("total_fare")}</div>
                        </TableHead>
                        <TableHead onClick={() => handleSort("driver_payout")} className="text-xs font-bold uppercase cursor-pointer hover:bg-slate-100 transition whitespace-nowrap">
                          <div className="flex items-center gap-1"><Banknote size={12} /> {t("driver_payout")}</div>
                        </TableHead>
                        <TableHead onClick={() => handleSort("fee")} className="text-xs font-bold uppercase cursor-pointer hover:bg-slate-100 transition whitespace-nowrap">
                          <div className="flex items-center gap-1"><Banknote size={12} /> {t("commission")}</div>
                        </TableHead>
                        <TableHead onClick={() => handleSort("createdAt")} className="text-right text-xs font-bold uppercase cursor-pointer hover:bg-slate-100 transition whitespace-nowrap">
                          {t("date")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedBookings.map((booking) => (
                        <TableRow key={booking.id} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="font-medium text-xs text-slate-400">{booking.id.slice(-6)}</TableCell>
                          <TableCell>
                             <StatusBadge status={booking.status} />
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{booking.distance} {t("km_unit")}</TableCell>
                          <TableCell className="font-bold text-xs text-slate-900 whitespace-nowrap">{t("currency")}{booking.fare}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{t("currency")}{Math.floor(booking.fare * 0.8)}</TableCell>
                          <TableCell className="text-emerald-600 font-bold text-xs whitespace-nowrap">{t("currency")}{Math.ceil(booking.fare * 0.2)}</TableCell>
                          <TableCell className="text-right text-xs text-slate-500 whitespace-nowrap">{formatDate(booking.createdAt, t)}</TableCell>
                        </TableRow>
                      ))}
                      {paginatedBookings.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-xs text-slate-500 py-10 italic">
                            {t("no_bookings")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination Controls */}
                <div className="mt-4 flex items-center justify-between px-2">
                  <p className="text-xs text-slate-500 font-medium">
                    Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, bookings.length)} of {bookings.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <AppButton 
                      variant="ghost" 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="h-9 w-9 p-0 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
                      leftIcon={<ChevronLeft size={16} />}
                    />
                    <div className="text-[10px] font-black text-slate-600 px-4 bg-slate-100 h-9 flex items-center rounded-xl uppercase tracking-widest">
                      {currentPage} / {Math.max(1, totalPages)}
                    </div>
                    <AppButton 
                      variant="ghost" 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="h-9 w-9 p-0 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
                      leftIcon={<ChevronRight size={16} />}
                    />
                  </div>
                </div>
              </CardContent>
              </Card>
           </div>
         </div>
          </>
        )}

        {/* Tab Content: Drivers */}
        {activeTab === "drivers" && (
           <div className="space-y-6">
              <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
                 <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                    <div className="flex items-center justify-between">
                       <CardTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                          <Users className="text-blue-600" />
                          {t("driver_management")}
                       </CardTitle>
                       <Badge variant="outline" className="font-black px-4 py-1.5 rounded-lg border-2">
                          {t("total")}: {allDrivers.length}
                       </Badge>
                    </div>
                 </CardHeader>
                 <CardContent className="p-0">
                    <Table>
                       <TableHeader>
                          <TableRow className="hover:bg-transparent border-none">
                             <TableHead className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("driver")}</TableHead>
                             <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("identity_vehicle")}</TableHead>
                             <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("status")}</TableHead>
                             <TableHead className="px-8 py-5 text-right text-xs font-black uppercase tracking-widest text-slate-400">{t("actions")}</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {allDrivers.map((driver) => (
                             <TableRow key={driver.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                <TableCell className="px-8 py-6">
                                   <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                         {driver.photoUrl ? (
                                            <Image src={driver.photoUrl} alt={driver.name} width={48} height={48} className="w-full h-full object-cover rounded-2xl" />
                                         ) : (
                                            driver.name.slice(0, 2).toUpperCase()
                                         )}
                                      </div>
                                      <div>
                                         <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{driver.name}</p>
                                         <p className="text-xs font-medium text-slate-400">{driver.phone}</p>
                                      </div>
                                   </div>
                                </TableCell>
                                <TableCell>
                                   <div className="space-y-1">
                                      <p className="text-[10px] font-black text-slate-400 uppercase">{t("nid_number")}: <span className="text-slate-700">{driver.nidNumber || t("unassigned")}</span></p>
                                      <Badge variant="secondary" className="text-[9px] font-black uppercase bg-slate-900 text-white rounded-md px-2 py-0.5">
                                         {driver.vehicleNumber || t("unassigned")}
                                      </Badge>
                                   </div>
                                </TableCell>
                                <TableCell>
                                   <div className="flex flex-col gap-1.5">
                                      <Badge className={`w-fit text-[9px] font-black uppercase px-2 py-0.5 border-none shadow-sm ${
                                         driver.isApproved ? "bg-[#D4EDDA] text-[#155724]" : "bg-[#FFF3CD] text-[#856404]"
                                      }`}>
                                         {driver.isApproved ? t("approved") : t("pending")}
                                      </Badge>
                                      {driver.isSuspended && (
                                         <Badge className="w-fit text-[9px] font-black uppercase px-2 py-0.5 bg-red-100 text-red-700 border-none shadow-sm">
                                            {t("suspended")}
                                         </Badge>
                                      )}
                                   </div>
                                </TableCell>
                                <TableCell className="px-8 text-right">
                                   <div className="flex items-center justify-end gap-2">
                                      {!driver.isApproved && (
                                         <AppButton 
                                            onClick={() => handleApprove(driver.id)}
                                            className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-emerald-600/20"
                                         >
                                            {t("approve_btn")}
                                         </AppButton>
                                      )}
                                      <AppButton 
                                         variant={driver.isSuspended ? "primary" : "ghost"}
                                         onClick={() => handleToggleSuspend(driver.id, driver.isSuspended)}
                                         className={`h-9 px-4 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all duration-300 ${
                                            driver.isSuspended 
                                               ? "bg-slate-900 hover:bg-slate-800 text-white" 
                                               : "border border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200"
                                         }`}
                                         leftIcon={<ShieldAlert size={12} />}
                                      >
                                         {driver.isSuspended ? t("lift_suspension") : t("suspend")}
                                      </AppButton>
                                   </div>
                                </TableCell>
                             </TableRow>
                          ))}
                          {allDrivers.length === 0 && (
                             <TableRow>
                                <TableCell colSpan={4} className="py-20 text-center">
                                   <div className="flex flex-col items-center justify-center gap-3 text-slate-400 italic">
                                      <Users size={40} className="opacity-10" />
                                      <p className="text-sm">{t("no_drivers")}</p>
                                   </div>
                                </TableCell>
                             </TableRow>
                          )}
                       </TableBody>
                    </Table>
                 </CardContent>
              </Card>
           </div>
        )}

        {/* Tab Content: Users */}
        {activeTab === "users" && (
           <div className="space-y-6">
              <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
                 <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                    <CardTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                       <UserCheck className="text-emerald-600" />
                       {t("user_management")}
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-0">
                    <Table>
                       <TableHeader>
                          <TableRow className="hover:bg-transparent border-none">
                             <TableHead className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("user")}</TableHead>
                             <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("logs")}</TableHead>
                             <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("status")}</TableHead>
                             <TableHead className="px-8 py-5 text-right text-xs font-black uppercase tracking-widest text-slate-400">{t("joined_date")}</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {allUsers.map((user) => (
                             <TableRow key={user.id} className="hover:bg-slate-50/50 border-b border-slate-50">
                                <TableCell className="px-8 py-6">
                                   <div>
                                      <p className="font-black text-slate-900">{user.phone}</p>
                                      <p className="text-xs font-medium text-slate-400">{user.name}</p>
                                   </div>
                                </TableCell>
                                <TableCell>
                                   <Badge variant="outline" className="font-black px-3 py-1 bg-slate-50 rounded-lg">
                                      {user.bookingCount} {t("logs")}
                                   </Badge>
                                </TableCell>
                                <TableCell>
                                   <Badge className={`text-[9px] font-black uppercase border-none ${
                                      user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                   }`}>
                                      {user.role}
                                   </Badge>
                                </TableCell>
                                <TableCell className="px-8 text-right text-xs text-slate-500 font-medium">
                                   {new Date(user.createdAt).toLocaleDateString()}
                                </TableCell>
                             </TableRow>
                          ))}
                          {allUsers.length === 0 && (
                             <TableRow>
                                <TableCell colSpan={4} className="py-20 text-center">
                                   <div className="flex flex-col items-center justify-center gap-3 text-slate-400 italic">
                                      <UserCheck size={40} className="opacity-10" />
                                      <p className="text-sm">{t("no_users")}</p>
                                   </div>
                                </TableCell>
                             </TableRow>
                          )}
                       </TableBody>
                    </Table>
                 </CardContent>
              </Card>
           </div>
        )}

        {/* Tab Content: Logs */}
        {activeTab === "logs" && (
           <div className="space-y-6">
              <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
                 <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                    <div className="flex items-center justify-between">
                       <CardTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                          <History className="text-slate-600" />
                          {t("full_booking_log")}
                       </CardTitle>
                       <div className="flex items-center gap-3">
                           <AppButton variant="ghost" className="h-10 rounded-xl px-4 text-xs font-black uppercase border border-slate-200" leftIcon={<Filter size={14} />}>
                              {t("filter")}
                           </AppButton>
                       </div>
                    </div>
                 </CardHeader>
                 <CardContent className="p-0">
                    <Table>
                       <TableHeader>
                          <TableRow className="hover:bg-transparent border-none">
                             <TableHead className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("id")}</TableHead>
                             <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("driver")}</TableHead>
                             <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("distance")}</TableHead>
                             <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("total_fare")}</TableHead>
                             <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("driver_payout")}</TableHead>
                             <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("commission")}</TableHead>
                             <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("status")}</TableHead>
                             <TableHead className="px-8 py-5 text-right text-xs font-black uppercase tracking-widest text-slate-400">{t("datetime")}</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {bookings.map((booking) => (
                             <TableRow key={booking.id} className="hover:bg-slate-50/50 border-b border-slate-50">
                                <TableCell className="px-8 py-6 font-black text-xs text-slate-400 uppercase tracking-tighter">
                                   #{booking.id.slice(-6)}
                                </TableCell>
                                <TableCell>
                                   {booking.driver ? (
                                      <div>
                                         <p className="font-black text-xs text-slate-800">{booking.driver.name}</p>
                                         <p className="text-[10px] text-slate-400">{booking.driver.phone}</p>
                                      </div>
                                   ) : (
                                      <span className="text-xs italic text-slate-300">{t("unassigned")}</span>
                                   )}
                                </TableCell>
                                 <TableCell className="text-xs font-medium text-slate-600">
                                    {booking.distance} {t("km_unit")}
                                 </TableCell>
                                 <TableCell className="font-black text-xs text-slate-900">
                                    {t("currency")}{booking.fare}
                                 </TableCell>
                                 <TableCell className="text-xs font-medium text-slate-600">
                                    {t("currency")}{Math.floor(booking.fare * 0.8)}
                                 </TableCell>
                                 <TableCell className="text-xs font-bold text-emerald-600">
                                    {t("currency")}{Math.ceil(booking.fare * 0.2)}
                                 </TableCell>
                                 <TableCell>
                                     <StatusBadge status={booking.status} />
                                 </TableCell>
                                 <TableCell className="px-8 text-right text-[11px] text-slate-500 font-medium">
                                    {formatDate(booking.createdAt, t, true)}
                                 </TableCell>
                             </TableRow>
                          ))}
                          {bookings.length === 0 && (
                             <TableRow>
                                <TableCell colSpan={8} className="py-20 text-center">
                                   <div className="flex flex-col items-center justify-center gap-3 text-slate-400 italic">
                                      <History size={40} className="opacity-10" />
                                      <p className="text-sm">{t("no_bookings")}</p>
                                   </div>
                                </TableCell>
                             </TableRow>
                          )}
                       </TableBody>
                    </Table>
                 </CardContent>
              </Card>
           </div>
        )}

      </main>
    </div>
  );
}
