"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppButton } from "@/components/ui/AppButton";
import { History, Filter, Route, Banknote, ChevronLeft, ChevronRight } from "lucide-react";
import { StatusBadge } from "../shared";
import { formatDate } from "../../utils/format";
import { TextKey } from "@/constants/text";
import { AdminStats } from "@/lib/types/admin";
import { Booking } from "@/lib/types/booking";

interface LogsTabProps {
  stats: AdminStats | null;
  bookings: Booking[];
  paginatedBookings: Booking[];
  logFilter: string;
  setLogFilter: (filter: string) => void;
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  totalPages: number;
  itemsPerPage: number;
  handleSort: (key: keyof Booking | "fee" | "driver_payout") => void;
  fetchBookings: (status: string) => void;
  t: (key: TextKey) => string;
}

export function LogsTab({
  stats,
  bookings,
  paginatedBookings,
  logFilter,
  setLogFilter,
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
  handleSort,
  fetchBookings,
  t,
}: LogsTabProps) {
  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-none shadow-sm bg-white p-4 flex flex-col justify-center items-center text-center">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{t("total_bookings") || "TOTAL BOOKINGS"}</p>
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
                  <option value="ALL">{t("all") || "ALL BOOKINGS"}</option>
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
              onClick={() => setCurrentPage(prev => Math.max(1, typeof prev === 'number' ? prev - 1 : 1))}
              disabled={currentPage === 1}
              className="h-10 w-10 p-0 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
              leftIcon={<ChevronLeft size={16} />}
            />
            <div className="text-[10px] font-black text-slate-600 px-5 bg-slate-100 h-10 flex items-center rounded-xl uppercase tracking-widest">
              {currentPage} / {Math.max(1, totalPages)}
            </div>
            <AppButton
              variant="ghost"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, typeof prev === 'number' ? prev + 1 : totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="h-10 w-10 p-0 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
              leftIcon={<ChevronRight size={16} />}
            />
          </div>
        </div>
      )}
    </div>
  );
}
