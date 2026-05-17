import React from "react";
import { UserCheck, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AppButton } from "@/components/ui/AppButton";
import { TextKey } from "@/constants/text";
import { User as UserType } from "@/lib/types/user";

interface UsersTabProps {
  t: (key: TextKey) => string;
  allUsers: UserType[];
  userSearch: string;
  setUserSearch: (search: string) => void;
  userFilter: string;
  setUserFilter: (filter: string) => void;
  userPage: number;
  setUserPage: (page: number | ((prev: number) => number)) => void;
  userMeta: { total: number; totalPages: number };
}

export const UsersTab: React.FC<UsersTabProps> = ({
  t,
  allUsers,
  userSearch,
  setUserSearch,
  userFilter,
  setUserFilter,
  userPage,
  setUserPage,
  userMeta,
}) => {
  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
              <UserCheck className="text-primary" />
              {t("user_management")}
            </CardTitle>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  placeholder={t("search") || "Search users..."}
                  className="w-full sm:w-[240px] h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                />
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={userFilter}
                  onChange={(e) => {
                    setUserFilter(e.target.value);
                    setUserPage(1);
                  }}
                  className="appearance-none w-full sm:w-auto h-11 rounded-xl pl-10 pr-8 text-xs font-black uppercase border border-slate-200 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer text-slate-700"
                >
                  <option value="ALL">{t("all") || "ALL ROLES"}</option>
                  <option value="PASSENGER">PASSENGER</option>
                  <option value="DRIVER">DRIVER</option>
                  <option value="ADMIN">ADMIN</option>
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
                    <Badge className={`text-[9px] font-black uppercase border-none ${user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
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

      {/* Pagination Controls */}
      {allUsers.length > 0 && (
        <div className="flex items-center justify-between px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-100 mt-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">
            Showing {(userPage - 1) * 20 + 1}–{Math.min(userPage * 20, userMeta.total)} of {userMeta.total}
          </p>
          <div className="flex items-center gap-2">
            <AppButton
              variant="ghost"
              onClick={() => setUserPage((prev) => Math.max(1, typeof prev === 'number' ? prev - 1 : 1))}
              disabled={userPage === 1}
              className="h-10 w-10 p-0 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
              leftIcon={<ChevronLeft size={16} />}
            />
            <div className="text-[10px] font-black text-slate-600 px-5 bg-slate-100 h-10 flex items-center rounded-xl uppercase tracking-widest">
              {userPage} / {Math.max(1, userMeta.totalPages)}
            </div>
            <AppButton
              variant="ghost"
              onClick={() => setUserPage((prev) => Math.min(userMeta.totalPages, typeof prev === 'number' ? prev + 1 : userMeta.totalPages))}
              disabled={userPage === userMeta.totalPages || userMeta.totalPages === 0}
              className="h-10 w-10 p-0 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
              leftIcon={<ChevronRight size={16} />}
            />
          </div>
        </div>
      )}
    </div>
  );
};
