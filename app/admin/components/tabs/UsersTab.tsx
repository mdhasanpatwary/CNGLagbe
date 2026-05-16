import React from "react";
import { UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TextKey } from "@/constants/text";
import { User as UserType } from "@/lib/types/user";

interface UsersTabProps {
  t: (key: TextKey) => string;
  allUsers: UserType[];
}

export const UsersTab: React.FC<UsersTabProps> = ({ t, allUsers }) => {
  return (
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
    </div>
  );
};
