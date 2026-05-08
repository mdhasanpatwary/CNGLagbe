"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, TrendingUp, HandCoins, Banknote, Route, MapPin, Activity, ShieldAlert, History, Filter, ChevronLeft, ChevronRight, Store, Plus, Trash2, Edit2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppButton } from "@/components/ui/AppButton";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { useLang } from "@/hooks/useLang";
import { User as UserType } from "@/lib/types/user";
import { Booking } from "@/lib/types/booking";
import { AdminStats, PendingDriver } from "@/lib/types/admin";
import { type TextKey } from "@/constants/text";
import { PageHeading } from "@/components/ui/PageHeading";

const formatDate = (date: string | Date | undefined, t: (key: TextKey) => string, includeDate = false) => {
  if (!date) return t("just_now");
  const d = new Date(date);
  if (isNaN(d.getTime())) return t("just_now");
  
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (!includeDate) return timeStr;
  
  return `${d.toLocaleDateString()} ${timeStr}`;
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    COMPLETED: "bg-primary/10 text-primary-dark border-primary/20",
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

export default function AdminDashboard() {
  const { t } = useLang();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [bazars, setBazars] = useState<{ id: string, name: string, driverCount?: number }[]>([]);
  const [newBazarName, setNewBazarName] = useState("");
  const [editingBazar, setEditingBazar] = useState<{ id: string, name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "drivers" | "users" | "logs" | "bazars">("overview");
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [logFilter, setLogFilter] = useState<string>("ALL");
  
  // Sorting & Pagination state
  const [sortConfig, setSortConfig] = useState<{ key: keyof Booking | "fee" | "driver_payout"; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handleSort = (key: keyof Booking | "fee" | "driver_payout") => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedBookings = [...bookings].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const aVal = (key === "fee" ? a.fare * 0.2 : 
                  key === "driver_payout" ? a.fare * 0.8 : 
                  key === "driver" ? a.driver?.name || "" : 
                  a[key as keyof Booking]) ?? "";
    
    const bVal = (key === "fee" ? b.fare * 0.2 : 
                  key === "driver_payout" ? b.fare * 0.8 : 
                  key === "driver" ? b.driver?.name || "" : 
                  b[key as keyof Booking]) ?? "";

    if (aVal === bVal) return 0;
    
    let result = 0;
    if (typeof aVal === "number" && typeof bVal === "number") {
      result = aVal < bVal ? -1 : 1;
    } else {
      result = String(aVal).localeCompare(String(bVal));
    }
    
    return direction === "asc" ? result : -result;
  });

  const paginatedBookings = sortedBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(bookings.length / itemsPerPage);


  const [pendingDrivers, setPendingDrivers] = useState<PendingDriver[]>([]);
  const [onlineDrivers, setOnlineDrivers] = useState<PendingDriver[]>([]);
  const [allDrivers, setAllDrivers] = useState<PendingDriver[]>([]);

  const fetchData = async (options?: { showLoading?: boolean }) => {
    if (options?.showLoading) setIsRefreshing(true);
    try {
       const url = logFilter === "ALL" 
         ? "/api/admin/bookings?limit=100" 
         : `/api/admin/bookings?limit=100&status=${logFilter}`;
         
       const [resStats, resBookings, resDrivers, resActive, resOnline, resAllDrivers, resAllUsers, resBazars] = await Promise.all([
         fetch("/api/admin/stats"),
         fetch(url),
         fetch("/api/admin/drivers/approve"),
         fetch("/api/admin/bookings?type=active"),
         fetch("/api/admin/drivers/online"),
         fetch("/api/admin/drivers?limit=100"),
         fetch("/api/admin/users?limit=100"),
         fetch("/api/bazars")
       ]);
       
       const dataStats = await resStats.json().catch(() => ({}));
       const dataBookings = await resBookings.json().catch(() => ({}));
       const dataDrivers = await resDrivers.json().catch(() => ({}));
       const dataActive = await resActive.json().catch(() => ({}));
       const dataOnline = await resOnline.json().catch(() => ({}));
       const dataAllDrivers = await resAllDrivers.json().catch(() => ({}));
       const dataAllUsers = await resAllUsers.json().catch(() => ({}));
       const dataBazars = await resBazars.json().catch(() => ([]));
       
       setStats(dataStats?.stats || null);
       setBookings(Array.isArray(dataBookings?.bookings) ? dataBookings.bookings : []);
       setPendingDrivers(Array.isArray(dataDrivers?.drivers) ? dataDrivers.drivers : []);
       setActiveBookings(Array.isArray(dataActive?.bookings) ? dataActive.bookings : []);
       setOnlineDrivers(Array.isArray(dataOnline?.drivers) ? dataOnline.drivers : []);
       setAllDrivers(Array.isArray(dataAllDrivers?.drivers) ? dataAllDrivers.drivers : []);
       setAllUsers(Array.isArray(dataAllUsers?.users) ? dataAllUsers.users : []);
       
       // Explicitly handle bazars array detection
        if (Array.isArray(dataBazars)) {
          setBazars(dataBazars);
        } else if (dataBazars && typeof dataBazars === 'object' && 'bazars' in dataBazars && Array.isArray((dataBazars as Record<string, unknown>).bazars)) {
          setBazars((dataBazars as { bazars: { id: string; name: string; driverCount?: number }[] }).bazars);
        } else {
          setBazars([]);
        }

    } catch (e: unknown) {
       console.error("Admin dashboard fetch error:", e);
    } finally {
       setIsRefreshing(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchData({ showLoading: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBookings = async (status: string) => {
    setIsRefreshing(true);
    try {
      const url = status === "ALL" 
        ? "/api/admin/bookings?limit=100" 
        : `/api/admin/bookings?limit=100&status=${status}`;
      const res = await fetch(url);
      const data = await res.json();
      setBookings(Array.isArray(data?.bookings) ? data.bookings : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

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

  const handleAddBazar = async () => {
    if (!newBazarName.trim()) return;
    try {
      const res = await fetch("/api/bazars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBazarName.trim() })
      });
      if (res.ok) {
        setNewBazarName("");
        fetchData({ showLoading: false });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBazar = async (id: string) => {
    if (!confirm(t("delete_bazar") + "?")) return;
    try {
      const res = await fetch(`/api/bazars/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchData({ showLoading: false });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateBazar = async () => {
    if (!editingBazar || !editingBazar.name.trim()) return;
    try {
      const res = await fetch(`/api/bazars/${editingBazar.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingBazar.name.trim() })
      });
      if (res.ok) {
        setEditingBazar(null);
        fetchData({ showLoading: false });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header 
        role="admin" 
        onRefresh={() => fetchData({ showLoading: true })} 
        isRefreshing={isRefreshing} 
      />


      <main className="max-w-7xl mx-auto p-6 md:p-8">
        <PageHeading 
          title={t("admin_dashboard") as string} 
          subtitle={t("admin_portal") as string}
          className="mb-8"
        />
        
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-10 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-slate-200/50 w-fit relative">
           {[
             { id: "overview", label: t("overview"), icon: Activity },
             { id: "drivers", label: t("drivers"), icon: Users },
             { id: "users", label: t("users"), icon: UserCheck },
             { id: "bazars", label: t("bazars"), icon: Store },
             { id: "logs", label: t("logs"), icon: History }
           ].map((tab) => (
              <AppButton
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "overview" | "drivers" | "users" | "logs" | "bazars")}
                variant={activeTab === tab.id ? "primary" : "ghost"}
                className={`relative px-6 h-11 flex items-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 z-10 ${
                  activeTab === tab.id 
                    ? "text-white bg-slate-900 shadow-lg shadow-slate-900/20" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
                }`}
              >
                <tab.icon size={14} className={activeTab === tab.id ? "text-primary" : ""} />
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
                   <div className="bg-primary/10 p-2 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-primary" />
                   </div>
                </CardHeader>
                <CardContent>
                   <div className="text-3xl font-black flex items-center gap-1.5 text-slate-900">
                     <span className="text-primary text-lg">{t("currency")}</span>
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
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-primary">
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
                          {onlineDrivers.map((d: PendingDriver) => (
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
                                         <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                         <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{t("online")}</span>
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
                    <UserCheck className="text-primary" />
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
                               className={`w-full h-10 ${isIncomplete ? "bg-slate-200 text-slate-400 grayscale" : "bg-primary hover:bg-primary-dark shadow-lg shadow-primary/20"} text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300`}
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
                          <TableCell className="text-primary font-bold text-xs whitespace-nowrap">{t("currency")}{Math.ceil(booking.fare * 0.2)}</TableCell>
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
                          {allDrivers.map((driver: PendingDriver) => (
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
                                         driver.isApproved ? "bg-primary/10 text-primary-dark" : "bg-warning text-warning-dark"
                                      }`}>
                                         {driver.isApproved ? t("approved") : t("pending")}
                                      </Badge>
                                      {driver.isSuspended && (
                                         <Badge className="w-fit text-[9px] font-black uppercase px-2 py-0.5 bg-error-light text-error-dark border-none shadow-sm">
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
                                            className="h-9 px-4 bg-primary hover:bg-primary-dark text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-primary/20"
                                         >
                                            {t("approve_btn")}
                                         </AppButton>
                                      )}
                                      <AppButton 
                                         variant={driver.isSuspended ? "primary" : "ghost"}
                                          onClick={() => handleToggleSuspend(driver.id, !!driver.isSuspended)}
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
                       <UserCheck className="text-primary" />
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
              {stats && (
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card className="border-none shadow-sm bg-white p-4 flex flex-col justify-center items-center text-center">
                       <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{t("total_rides") || "TOTAL RIDES"}</p>
                       <p className="text-2xl font-black text-slate-800 mt-1">{stats.totalBookings || 0}</p>
                    </Card>
                    <Card className="border-none shadow-sm bg-primary/10 p-4 flex flex-col justify-center items-center text-center border-b-2 border-primary">
                       <p className="text-[10px] uppercase font-black text-primary-dark tracking-widest">{t("completed") || "COMPLETED"}</p>
                       <p className="text-2xl font-black text-primary-dark mt-1">{stats.completedBookings || 0}</p>
                       <p className="text-[10px] font-bold text-primary mt-1 bg-primary/10 px-2 py-0.5 rounded-full">
                          {stats.totalBookings ? Math.round(((stats.completedBookings || 0) / stats.totalBookings) * 100) : 0}%
                       </p>
                    </Card>
                    <Card className="border-none shadow-sm bg-red-50 p-4 flex flex-col justify-center items-center text-center border-b-2 border-red-500">
                       <p className="text-[10px] uppercase font-black text-red-700 tracking-widest">{t("cancelled") || "CANCELLED"}</p>
                       <p className="text-2xl font-black text-red-700 mt-1">{stats.cancelledBookings || 0}</p>
                       <p className="text-[10px] font-bold text-red-600 mt-1 bg-red-100 px-2 py-0.5 rounded-full">
                          {stats.totalBookings ? Math.round(((stats.cancelledBookings || 0) / stats.totalBookings) * 100) : 0}%
                       </p>
                    </Card>
                    <Card className="border-none shadow-sm bg-amber-50 p-4 flex flex-col justify-center items-center text-center border-b-2 border-amber-500">
                       <p className="text-[10px] uppercase font-black text-amber-700 tracking-widest">{t("timed_out") || "TIMED OUT"}</p>
                       <p className="text-2xl font-black text-amber-700 mt-1">{stats.timedOutBookings || 0}</p>
                       <p className="text-[10px] font-bold text-amber-600 mt-1 bg-amber-100 px-2 py-0.5 rounded-full">
                          {stats.totalBookings ? Math.round(((stats.timedOutBookings || 0) / stats.totalBookings) * 100) : 0}%
                       </p>
                    </Card>
                    <Card className="border-none shadow-sm bg-blue-50 p-4 flex flex-col justify-center items-center text-center border-b-2 border-blue-500">
                       <p className="text-[10px] uppercase font-black text-blue-700 tracking-widest">{t("active") || "ACTIVE/PENDING"}</p>
                       <p className="text-2xl font-black text-blue-700 mt-1">{(stats.pendingBookings || 0) + (stats.acceptedBookings || 0)}</p>
                       <p className="text-[10px] font-bold text-blue-600 mt-1 bg-blue-100 px-2 py-0.5 rounded-full">
                          {stats.totalBookings ? Math.round((((stats.pendingBookings || 0) + (stats.acceptedBookings || 0)) / stats.totalBookings) * 100) : 0}%
                       </p>
                    </Card>
                 </div>
              )}
              <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
                 <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                    <div className="flex items-center justify-between">
                       <CardTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                          <History className="text-slate-600" />
                          {t("full_booking_log")}
                       </CardTitle>
                       <div className="flex items-center gap-3">
                           <div className="relative">
                              <select 
                                className="appearance-none h-10 rounded-xl pl-10 pr-8 text-xs font-black uppercase border border-slate-200 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer text-slate-700"
                                value={logFilter}
                                onChange={(e) => {
                                  setLogFilter(e.target.value);
                                  setCurrentPage(1);
                                  fetchBookings(e.target.value);
                                }}
                              >
                                <option value="ALL">{t("all") || "ALL RIDES"}</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="CANCELLED">CANCELLED</option>
                                <option value="TIMED_OUT">TIMED_OUT</option>
                                <option value="PENDING">PENDING</option>
                                <option value="ACCEPTED">ACCEPTED</option>
                              </select>
                              <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                           </div>
                       </div>
                    </div>
                 </CardHeader>
                 <CardContent className="p-0">
                    <Table>
                       <TableHeader>
                          <TableRow className="hover:bg-transparent border-none">
                             <TableHead onClick={() => handleSort("id")} className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:bg-slate-100 transition">{t("id")}</TableHead>
                             <TableHead onClick={() => handleSort("driver")} className="py-5 text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:bg-slate-100 transition">{t("driver")}</TableHead>
                             <TableHead onClick={() => handleSort("distance")} className="py-5 text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap">
                               <div className="flex items-center gap-1"><Route size={12} /> {t("distance")}</div>
                             </TableHead>
                             <TableHead onClick={() => handleSort("fare")} className="py-5 text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap">
                               <div className="flex items-center gap-1"><Banknote size={12} /> {t("total_fare")}</div>
                             </TableHead>
                             <TableHead onClick={() => handleSort("driver_payout")} className="py-5 text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap">
                               <div className="flex items-center gap-1"><Banknote size={12} /> {t("driver_payout")}</div>
                             </TableHead>
                             <TableHead onClick={() => handleSort("fee")} className="py-5 text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap">
                               <div className="flex items-center gap-1"><Banknote size={12} /> {t("commission")}</div>
                             </TableHead>
                             <TableHead onClick={() => handleSort("status")} className="py-5 text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:bg-slate-100 transition">{t("status")}</TableHead>
                             <TableHead onClick={() => handleSort("createdAt")} className="px-8 py-5 text-right text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap">{t("datetime")}</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {paginatedBookings.map((booking) => (
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
                                 <TableCell className="text-xs font-bold text-primary">
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

              {/* Pagination Controls */}
              {bookings.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-100 mt-4">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">
                    Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, bookings.length)} of {bookings.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <AppButton 
                      variant="ghost" 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="h-10 w-10 p-0 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
                      leftIcon={<ChevronLeft size={16} />}
                    />
                    <div className="text-[10px] font-black text-slate-600 px-5 bg-slate-100 h-10 flex items-center rounded-xl uppercase tracking-widest">
                      {currentPage} / {Math.max(1, totalPages)}
                    </div>
                    <AppButton 
                      variant="ghost" 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="h-10 w-10 p-0 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
                      leftIcon={<ChevronRight size={16} />}
                    />
                  </div>
                </div>
              )}
           </div>
        )}

        {activeTab === "bazars" && (
           <div className="space-y-6">
              <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
                 <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                       <CardTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                          <Store className="text-primary" />
                          {t("bazars")}
                       </CardTitle>
                       
                       <div className="flex items-center gap-2">
                          <input 
                             type="text" 
                             value={newBazarName}
                             onChange={(e) => setNewBazarName(e.target.value)}
                             placeholder={t("bazar_name")}
                             className="h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white min-w-[200px]"
                             onKeyDown={(e) => e.key === "Enter" && handleAddBazar()}
                          />
                          <AppButton 
                             onClick={handleAddBazar}
                             className="h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-slate-900/10"
                             leftIcon={<Plus size={16} />}
                          >
                             {t("add_bazar")}
                          </AppButton>
                       </div>
                    </div>
                 </CardHeader>
                 <CardContent className="p-0">
                    <Table>
                       <TableHeader>
                          <TableRow className="hover:bg-transparent border-none">
                             <TableHead className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("bazar_name")}</TableHead>
                             <TableHead className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("drivers")}</TableHead>
                             <TableHead className="px-8 py-5 text-right text-xs font-black uppercase tracking-widest text-slate-400">{t("actions")}</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {bazars.map((bazar) => (
                             <TableRow key={bazar.id} className="hover:bg-slate-50/50 border-b border-slate-50">
                                <TableCell className="px-8 py-6">
                                   {editingBazar?.id === bazar.id ? (
                                      <input 
                                         type="text" 
                                         value={editingBazar.name}
                                         onChange={(e) => setEditingBazar({ ...editingBazar, name: e.target.value })}
                                         className="h-9 px-3 rounded-lg border border-primary text-sm focus:outline-none bg-white w-full max-w-xs"
                                         autoFocus
                                         onKeyDown={(e) => {
                                            if (e.key === "Enter") handleUpdateBazar();
                                            if (e.key === "Escape") setEditingBazar(null);
                                         }}
                                      />
                                   ) : (
                                      <p className="font-black text-slate-900">{bazar.name}</p>
                                   )}
                                </TableCell>
                                <TableCell className="px-8 py-6">
                                   <div className="flex items-center gap-2">
                                      <Users size={14} className="text-slate-400" />
                                      <span className="font-bold text-slate-700">{bazar.driverCount || 0}</span>
                                   </div>
                                </TableCell>
                                <TableCell className="px-8 py-6 text-right">
                                   <div className="flex items-center justify-end gap-2">
                                      {editingBazar?.id === bazar.id ? (
                                         <>
                                            <AppButton 
                                               onClick={handleUpdateBazar}
                                               variant="primary"
                                               className="h-8 px-3 text-[9px] font-black uppercase rounded-lg"
                                            >
                                               {t("save_changes")}
                                            </AppButton>
                                            <AppButton 
                                               onClick={() => setEditingBazar(null)}
                                               variant="ghost"
                                               className="h-8 px-3 text-[9px] font-black uppercase rounded-lg border border-slate-200"
                                            >
                                               {t("back")}
                                            </AppButton>
                                         </>
                                      ) : (
                                         <>
                                            <AppButton 
                                               onClick={() => setEditingBazar(bazar)}
                                               variant="ghost"
                                               className="h-9 w-9 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                                               leftIcon={<Edit2 size={16} />}
                                            />
                                            <AppButton 
                                               onClick={() => handleDeleteBazar(bazar.id)}
                                               variant="ghost"
                                               className="h-9 w-9 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                                               leftIcon={<Trash2 size={16} />}
                                            />
                                         </>
                                      )}
                                   </div>
                                </TableCell>
                             </TableRow>
                          ))}
                           {bazars.length === 0 && (
                              <TableRow>
                                 <TableCell colSpan={3} className="py-20 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400 italic">
                                       <Store size={40} className="opacity-10" />
                                       <p className="text-sm">{t("not_found")}</p>
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
