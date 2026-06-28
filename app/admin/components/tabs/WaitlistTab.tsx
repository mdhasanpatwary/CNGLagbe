import React from "react";
import { Search, Filter, ChevronLeft, ChevronRight, Users, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AppButton } from "@/components/ui/AppButton";
import { TextKey } from "@/constants/text";
import { WaitlistEntry } from "../../hooks/useAdminDashboard";
import { StatsCard } from "../shared";

interface WaitlistTabProps {
  t: (key: TextKey) => string;
  waitlist: WaitlistEntry[];
  waitlistSearch: string;
  setWaitlistSearch: (search: string) => void;
  waitlistFilter: string;
  setWaitlistFilter: (filter: string) => void;
  waitlistPage: number;
  setWaitlistPage: (page: number | ((prev: number) => number)) => void;
  waitlistMeta: {
    total: number;
    totalPages: number;
    driverCount: number;
    passengerCount: number;
  };
}

export const WaitlistTab: React.FC<WaitlistTabProps> = ({
  t,
  waitlist,
  waitlistSearch,
  setWaitlistSearch,
  waitlistFilter,
  setWaitlistFilter,
  waitlistPage,
  setWaitlistPage,
  waitlistMeta,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title={t("waitlist_total_count")}
          value={waitlistMeta.driverCount + waitlistMeta.passengerCount}
          desc={t("waitlist") || "Waitlist"}
          icon={Users}
          variant="primary"
        />
        <StatsCard
          title={t("waitlist_driver_count")}
          value={waitlistMeta.driverCount}
          desc={t("waitlist_role_driver")}
          icon={UserCheck}
          variant="amber"
        />
        <StatsCard
          title={t("waitlist_passenger_count")}
          value={waitlistMeta.passengerCount}
          desc={t("waitlist_role_passenger")}
          icon={Users}
          variant="blue"
        />
      </div>

      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
              <Users className="text-primary animate-pulse" />
              {t("waitlist_management")}
            </CardTitle>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 sm:flex-initial">
                <input
                  type="text"
                  value={waitlistSearch}
                  onChange={(e) => {
                    setWaitlistSearch(e.target.value);
                    setWaitlistPage(1);
                  }}
                  placeholder={t("search_waitlist_placeholder") || "Search waitlist..."}
                  className="w-full sm:w-[260px] h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white transition-all"
                />
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Filter Dropdown */}
              <div className="relative">
                <select
                  value={waitlistFilter}
                  onChange={(e) => {
                    setWaitlistFilter(e.target.value);
                    setWaitlistPage(1);
                  }}
                  className="appearance-none w-full sm:w-auto h-11 rounded-xl pl-10 pr-8 text-xs font-black uppercase border border-slate-200 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer text-slate-700 transition-all"
                >
                  <option value="ALL">{t("all") || "ALL ROLES"}</option>
                  <option value="USER">{t("waitlist_role_passenger") || "Passenger"}</option>
                  <option value="DRIVER">{t("waitlist_role_driver") || "Driver"}</option>
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
                <TableHead className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("user")}</TableHead>
                <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("role")}</TableHead>
                <TableHead className="px-8 py-5 text-right text-xs font-black uppercase tracking-widest text-slate-400">{t("joined_date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {waitlist.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/50 border-b border-slate-50 transition-colors">
                  <TableCell className="px-8 py-6">
                    <div>
                      <p className="font-black text-slate-900">{item.phone}</p>
                      <p className="text-xs font-medium text-slate-400">{item.name || "N/A"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[9px] font-black uppercase border-none ${
                      item.role === "DRIVER" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {item.role === "DRIVER" ? t("waitlist_role_driver") : t("waitlist_role_passenger")}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 text-right text-xs text-slate-500 font-medium">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {waitlist.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400 italic">
                      <UserCheck size={40} className="opacity-10" />
                      <p className="text-sm">{t("no_waitlist_users")}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {waitlist.length > 0 && (
        <div className="flex items-center justify-between px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-100 mt-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">
            Showing {(waitlistPage - 1) * 20 + 1}–{Math.min(waitlistPage * 20, waitlistMeta.total)} of {waitlistMeta.total}
          </p>
          <div className="flex items-center gap-2">
            <AppButton
              variant="ghost"
              onClick={() => setWaitlistPage((prev) => Math.max(1, typeof prev === 'number' ? prev - 1 : 1))}
              disabled={waitlistPage === 1}
              className="h-10 w-10 p-0 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
              leftIcon={<ChevronLeft size={16} />}
            />
            <div className="text-[10px] font-black text-slate-600 px-5 bg-slate-100 h-10 flex items-center rounded-xl uppercase tracking-widest">
              {waitlistPage} / {Math.max(1, waitlistMeta.totalPages)}
            </div>
            <AppButton
              variant="ghost"
              onClick={() => setWaitlistPage((prev) => Math.min(waitlistMeta.totalPages, typeof prev === 'number' ? prev + 1 : waitlistMeta.totalPages))}
              disabled={waitlistPage === waitlistMeta.totalPages || waitlistMeta.totalPages === 0}
              className="h-10 w-10 p-0 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
              leftIcon={<ChevronRight size={16} />}
            />
          </div>
        </div>
      )}
    </div>
  );
};
