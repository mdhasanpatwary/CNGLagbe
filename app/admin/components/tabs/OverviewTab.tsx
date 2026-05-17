import React from "react";
import { Activity, Users, UserCheck, Route, Banknote, ChevronLeft, ChevronRight, TrendingUp, HandCoins, MapPin, ShieldAlert, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppButton } from "@/components/ui/AppButton";
import { Badge } from "@/components/ui/badge";
import { TextKey } from "@/constants/text";
import { AdminStats, PendingDriver } from "@/lib/types/admin";
import { Booking } from "@/lib/types/booking";
import { StatsCard, StatusBadge } from "../shared";
import { formatDate } from "../../utils/format";
import { formatDecimal } from "@/lib/utils";

interface OverviewTabProps {
  t: (key: TextKey) => string;
  stats: AdminStats | null;
  activeBookings: Booking[];
  onlineDrivers: PendingDriver[];
  pendingDrivers: PendingDriver[];
  handleApprove: (driverId: string) => Promise<void>;
  paginatedBookings: Booking[];
  handleSort: (key: keyof Booking | "fee" | "driver_payout") => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  itemsPerPage: number;
  totalBookings: number;
  bookingSearch: string;
  setBookingSearch: (search: string) => void;
  logFilter: string;
  setLogFilter: (filter: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  t,
  stats,
  activeBookings,
  onlineDrivers,
  pendingDrivers,
  handleApprove,
  paginatedBookings,
  handleSort,
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
  totalBookings,
  bookingSearch,
  setBookingSearch,
  logFilter,
  setLogFilter,
}) => {
  return (
    <>
      {/* Top metrics */}
      {stats ? (
        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              title={t("total_revenue")}
              value={stats.revenue?.total ?? 0}
              desc={t("revenue_desc")}
              icon={TrendingUp}
              variant="primary"
              currency={t("currency")}
              extra={stats.revenue?.voided ? (
                <p className="text-[10px] text-red-500 font-black mt-2 bg-red-50 w-fit px-2 py-0.5 rounded-md uppercase border border-red-100">
                  {t("voided_revenue")}: {t("currency")}{stats.revenue.voided}
                </p>
              ) : null}
            />

            <StatsCard
              title={t("admin_commission")}
              value={stats.revenue?.commission ?? 0}
              desc={t("commission_desc")}
              icon={HandCoins}
              variant="blue"
              currency={t("currency")}
            />

            <StatsCard
              title={t("driver_payouts")}
              value={stats.revenue?.driverPayout ?? 0}
              desc={t("payout_desc")}
              icon={Banknote}
              variant="purple"
              currency={t("currency")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              title={t("online_drivers")}
              value={stats.activeDrivers ?? 0}
              desc={stats.bookings?.pending && stats.bookings.pending > 0 ? `${stats.bookings.pending} ${t("needs_review")}` : `${t("assigned_desc")}: ${stats.bookings?.pending ?? 0}`}
              icon={Activity}
              variant="amber"
            />
            
            <StatsCard
              title={t("on_ride_drivers")}
              value={stats.onRideDrivers ?? 0}
              desc={t("trip_in_progress")}
              icon={Route}
              variant="primary"
            />
            
            <StatsCard
              title={t("offline_drivers")}
              value={stats.offlineDrivers ?? 0}
              desc={t("approved")}
              icon={Users}
              variant="purple"
            />
          </div>
        </div>
      ) : (
        <div className="animate-pulse space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-slate-200 rounded-xl w-full"></div>
            <div className="h-32 bg-slate-200 rounded-xl w-full"></div>
            <div className="h-32 bg-slate-200 rounded-xl w-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-slate-200 rounded-xl w-full"></div>
            <div className="h-32 bg-slate-200 rounded-xl w-full"></div>
            <div className="h-32 bg-slate-200 rounded-xl w-full"></div>
          </div>
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
                        <p className="font-bold text-sm text-slate-800">{t("currency")}{formatDecimal(b.fare)}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black">{formatDecimal(b.distance)} {t("km_unit")}</p>
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
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">{t("no_active_bookings_online")}</p>
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
          <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                  {t("recent_bookings")}
                </CardTitle>

                <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 xs:flex-initial">
                    <input
                      type="text"
                      value={bookingSearch}
                      onChange={(e) => {
                        setBookingSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder={t("search") || "Search..."}
                      className="w-full sm:w-[200px] h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                    />
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      className="appearance-none w-full sm:w-auto h-10 rounded-xl pl-9 pr-7 text-[10px] font-black uppercase border border-slate-200 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer text-slate-700"
                      value={logFilter}
                      onChange={(e) => {
                        setLogFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="ALL">{t("all") || "ALL"}</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="TIMED_OUT">TIMED_OUT</option>
                      <option value="PENDING">PENDING</option>
                      <option value="ACCEPTED">ACCEPTED</option>
                    </select>
                    <Filter size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
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
                        <TableCell className="text-xs whitespace-nowrap">{formatDecimal(booking.distance)} {t("km_unit")}</TableCell>
                        <TableCell className="font-bold text-xs text-slate-900 whitespace-nowrap">{t("currency")}{formatDecimal(booking.fare)}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{t("currency")}{formatDecimal(Math.floor(booking.fare * 0.8))}</TableCell>
                        <TableCell className="text-primary font-bold text-xs whitespace-nowrap">{t("currency")}{formatDecimal(Math.ceil(booking.fare * 0.2))}</TableCell>
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
                  Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalBookings)} of {totalBookings}
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
  );
};
