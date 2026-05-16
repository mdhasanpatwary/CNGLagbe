import React from "react";
import Image from "next/image";
import { Users, Search, Plus, Banknote, ShieldAlert, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppButton } from "@/components/ui/AppButton";
import { Badge } from "@/components/ui/badge";
import { TextKey } from "@/constants/text";
import { PendingDriver } from "@/lib/types/admin";

interface DriversTabProps {
  t: (key: TextKey) => string;
  driverMeta: { total: number; totalPages: number };
  driverSearch: string;
  setDriverSearch: (val: string) => void;
  setDriverPage: (page: number) => void;
  setEditingDriverData: (driver: PendingDriver | null) => void;
  setIsDriverModalOpen: (isOpen: boolean) => void;
  allDrivers: PendingDriver[];
  handleApprove: (driverId: string) => Promise<void>;
  setSelectedDriver: (driver: PendingDriver | null) => void;
  setIsRechargeModalOpen: (isOpen: boolean) => void;
  handleToggleSuspend: (driverId: string, currentlySuspended: boolean) => Promise<void>;
  handleDeleteDriver: (driverId: string) => Promise<void>;
}

export const DriversTab: React.FC<DriversTabProps> = ({
  t,
  driverMeta,
  driverSearch,
  setDriverSearch,
  setDriverPage,
  setEditingDriverData,
  setIsDriverModalOpen,
  allDrivers,
  handleApprove,
  setSelectedDriver,
  setIsRechargeModalOpen,
  handleToggleSuspend,
  handleDeleteDriver,
}) => {
  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <CardTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                <Users className="text-blue-600" />
                {t("driver_management")}
              </CardTitle>
              <Badge variant="outline" className="font-black px-4 py-1.5 rounded-lg border-2">
                {t("total")}: {driverMeta.total}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t("search_drivers") as string}
                  value={driverSearch}
                  onChange={(e) => {
                    setDriverSearch(e.target.value);
                    setDriverPage(1);
                  }}
                  className="h-11 pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-w-[240px]"
                />
              </div>

              <AppButton
                onClick={() => {
                  setEditingDriverData(null);
                  setIsDriverModalOpen(true);
                }}
                className="h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-slate-900/10"
                leftIcon={<Plus size={18} />}
              >
                {t("add_driver")}
              </AppButton>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("driver")}</TableHead>
                <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("identity_vehicle")}</TableHead>
                <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("status")}</TableHead>
                <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("current_balance")}</TableHead>
                <TableHead className="px-8 py-5 text-right text-xs font-black uppercase tracking-widest text-slate-400">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allDrivers.map((driver: PendingDriver) => (
                <TableRow key={driver.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                  <TableCell className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {driver.photoUrl ? (
                          <Image
                            src={driver.photoUrl}
                            alt={driver.name}
                            fill
                            className="object-cover rounded-2xl object-top transition-all duration-500"
                          />
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
                      <Badge className={`w-fit text-[9px] font-black uppercase px-2 py-0.5 border-none shadow-sm ${driver.isApproved ? "bg-primary/10 text-primary-dark" : "bg-warning text-warning-dark"
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
                  <TableCell>
                    <div className="flex flex-col">
                      <p className={`font-black text-sm ${driver.wallet?.balance && driver.wallet.balance < 0 ? "text-red-600" : "text-primary"}`}>
                        {t("currency")}{driver.wallet?.balance ?? 0}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                        {driver.wallet?.balance && driver.wallet.balance < 0 ? t("debt") : t("credit")}
                      </p>
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
                        onClick={() => {
                          setSelectedDriver(driver);
                          setIsRechargeModalOpen(true);
                        }}
                        variant="ghost"
                        className="h-9 px-4 text-[10px] font-black rounded-xl uppercase tracking-widest border border-primary/20 text-primary hover:bg-primary/5"
                        leftIcon={<Banknote size={12} />}
                      >
                        {t("add_money")}
                      </AppButton>
                      <AppButton
                        variant={driver.isSuspended ? "primary" : "ghost"}
                        onClick={() => handleToggleSuspend(driver.id, !!driver.isSuspended)}
                        className={`h-9 px-4 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all duration-300 ${driver.isSuspended
                          ? "bg-slate-900 hover:bg-slate-800 text-white"
                          : "border border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200"
                          }`}
                        leftIcon={<ShieldAlert size={12} />}
                      >
                        {driver.isSuspended ? t("lift_suspension") : t("suspend")}
                      </AppButton>
                      <AppButton
                        onClick={() => {
                          setEditingDriverData(driver);
                          setIsDriverModalOpen(true);
                        }}
                        variant="ghost"
                        className="h-9 w-9 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                        leftIcon={<Edit2 size={16} />}
                      />
                      <AppButton
                        onClick={() => handleDeleteDriver(driver.id)}
                        variant="ghost"
                        className="h-9 w-9 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                        leftIcon={<Trash2 size={16} />}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {allDrivers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
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
  );
};
