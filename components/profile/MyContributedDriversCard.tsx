"use client";

import { Car, Trash2, Pencil, MapPin, Phone, AlertTriangle, X, Check, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppButton } from "@/components/ui/AppButton";
import { useLang } from "@/hooks/useLang";
import { TextKey } from "@/constants/text";
import { useMyContributedDrivers, UserContributedDriver } from "@/hooks/useMyContributedDrivers";

interface MyContributedDriversCardProps {
  onEditDriver?: (driver: UserContributedDriver) => void;
}

export function MyContributedDriversCard({ onEditDriver }: MyContributedDriversCardProps) {
  const { t } = useLang();
  const {
    drivers,
    count,
    isLoading,
    isDeleteModalOpen,
    driverToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    handleConfirmDelete,
  } = useMyContributedDrivers();

  if (isLoading) {
    return (
      <Card className="shadow-2xl shadow-slate-200/50 border-none rounded-3xl overflow-hidden mb-8 bg-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Car size={20} />
          </div>
          <div className="h-6 w-40 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-2xl shadow-slate-200/50 border-none rounded-3xl overflow-hidden mb-8 bg-white">
        <div className="bg-primary h-2 w-full" />
        <CardContent className="p-8">
          {/* Card Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Car size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {t("my_contributed_drivers" as TextKey) || "আপনার যুক্ত করা ড্রাইভার"}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  আপনার জমা দেওয়া মোট তথ্য
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-black rounded-full">
              {count} জন
            </span>
          </div>

          {/* Drivers List or Empty State */}
          {count === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 p-6">
              <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-600">
                {t("no_contributed_drivers_yet" as TextKey) || "আপনি এখনো কোনো ড্রাইভার যুক্ত করেননি।"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  className="bg-slate-50 border border-slate-100 rounded-2xl p-4 transition-all hover:border-slate-200"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-slate-800">
                          {driver.name}
                        </h4>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                          {driver.vehicleType}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1">
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" />
                          {driver.phone}
                        </span>
                        {driver.nearbyBazar && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400" />
                            {driver.nearbyBazar}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    {driver.isApproved ? (
                      <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200/60">
                        <Check size={12} />
                        {t("status_approved" as TextKey) || "অনুমোদিত"}
                      </span>
                    ) : (
                      <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200/60">
                        <AlertTriangle size={12} />
                        {t("status_pending" as TextKey) || "অনুমোদন অপেক্ষমাণ"}
                      </span>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/60 mt-3">
                    {onEditDriver && (
                      <AppButton
                        variant="ghost"
                        onClick={() => onEditDriver(driver)}
                        className="h-8 px-3 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl"
                        leftIcon={<Pencil size={13} />}
                      >
                        সম্পাদনা
                      </AppButton>
                    )}
                    <AppButton
                      variant="ghost"
                      onClick={() => openDeleteModal(driver)}
                      className="h-8 px-3 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                      leftIcon={<Trash2 size={13} />}
                    >
                      মুছে ফেলুন
                    </AppButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && driverToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h4 className="text-lg font-black text-slate-800 mb-2">
              {t("delete_driver_title" as TextKey) || "ড্রাইভার মুছে ফেলুন"}
            </h4>
            <p className="text-xs text-slate-500 font-medium mb-6">
              {t("delete_driver_confirm" as TextKey) || "আপনি কি নিশ্চিত যে এই ড্রাইভারের তথ্য মুছে ফেলতে চান?"}
            </p>
            <div className="bg-slate-50 p-3 rounded-2xl mb-6 text-left border border-slate-100">
              <p className="text-xs font-bold text-slate-700">{driverToDelete.name}</p>
              <p className="text-[11px] text-slate-400 font-medium">{driverToDelete.phone}</p>
            </div>
            <div className="flex items-center gap-3">
              <AppButton
                variant="secondary"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="flex-1 h-12 rounded-xl text-xs font-bold"
                leftIcon={<X size={14} />}
              >
                {t("cancel" as TextKey) || "বাতিল"}
              </AppButton>
              <AppButton
                onClick={handleConfirmDelete}
                loading={isDeleting}
                disabled={isDeleting}
                className="flex-1 h-12 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
                leftIcon={!isDeleting && <Trash2 size={14} />}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "মুছে ফেলুন"
                )}
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
