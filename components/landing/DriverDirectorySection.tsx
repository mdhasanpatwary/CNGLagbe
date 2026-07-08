"use client";

import React from "react";
import { createPortal } from "react-dom";
import { Search, MapPin, Phone, Users, Plus, X, Trophy, Trash2 } from "lucide-react";
import { Controller } from "react-hook-form";
import { AppButton } from "@/components/ui/AppButton";
import { FormField } from "@/components/FormField";
import { useLang } from "@/hooks/useLang";
import { TextKey } from "@/constants/text";
import { Section } from "@/components/ui/Section";
import { SearchableBazarSelect } from "@/components/ui/SearchableBazarSelect";
import Image from "next/image";
import Link from "next/link";
import { User } from "@/lib/types/user";
import { useDriverDirectory } from "@/hooks/useDriverDirectory";

interface DriverDirectorySectionProps {
  isLanding?: boolean;
  initialUser?: User | null;
}

export function DriverDirectorySection({ isLanding = false, initialUser }: DriverDirectorySectionProps) {
  const { t } = useLang();
  const {
    drivers,
    selectedBazar,
    setSelectedBazar,
    selectedVehicleType,
    setSelectedVehicleType,
    searchQuery,
    setSearchQuery,
    isLoading,
    isSubmitModalOpen,
    setIsSubmitModalOpen,
    isSubmitting,
    mounted,
    isFetchingNext,
    activeTab,
    setActiveTab,
    leaderboard,
    isLeaderboardLoading,
    uploading,
    selectedContributor,
    setSelectedContributor,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    driverToDelete,
    setDriverToDelete,
    isDeleting,
    totalCount,
    overallCount,
    currentUser,
    observerRef,
    register,
    handleSubmit,
    control,
    errors,
    watchedVehicleType,
    onSubmit,
    handleDeleteDriver,
  } = useDriverDirectory({ isLanding, initialUser });

  return (
    <Section id="driver-directory" variant="slate" className="bg-slate-100/50 py-12 border-b border-slate-200">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-slate-200/60">
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight font-bn leading-tight">
              {t("driver_directory" as TextKey) || "CNG & Toto Driver List"}
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed max-w-xl">
              {t("directory_subtitle" as TextKey) || "Find CNG and Toto driver numbers in your area."}
            </p>
          </div>
          <AppButton
            onClick={() => setIsSubmitModalOpen(true)}
            leftIcon={<Plus className="w-5 h-5" />}
            className="w-full sm:w-auto h-12 px-6 rounded-xl bg-primary hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-600/20 transition-all shrink-0"
          >
            {t("add_driver_local" as TextKey) || "Add Driver"}
          </AppButton>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-8 items-end justify-between gap-4 shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex gap-4">
            <AppButton
              variant="ghost"
              onClick={() => setActiveTab("DRIVERS")}
              className={`pb-3 rounded-none border-b-2 hover:bg-transparent transition-all font-bold text-sm sm:text-base ${activeTab === "DRIVERS"
                  ? "text-primary border-primary"
                  : "text-slate-500 border-transparent hover:text-slate-800"
                }`}
            >
              {t("tab_all_drivers" as TextKey) || "Drivers List"}
            </AppButton>
            <AppButton
              variant="ghost"
              onClick={() => setActiveTab("LEADERBOARD")}
              leftIcon={<Trophy className="w-4.5 h-4.5 text-amber-500" />}
              className={`pb-3 rounded-none border-b-2 hover:bg-transparent transition-all font-bold text-sm sm:text-base ${activeTab === "LEADERBOARD"
                  ? "text-primary border-primary"
                  : "text-slate-500 border-transparent hover:text-slate-800"
                }`}
            >
              {t("tab_leaderboard" as TextKey) || "Leaderboard"}
            </AppButton>
          </div>
          {totalCount !== null && overallCount !== null && (
            <div className="hidden md:block text-xs sm:text-sm font-semibold text-slate-500 pb-3 font-bn self-end whitespace-nowrap">
              {totalCount < overallCount
                ? (t("driver_directory_count_filtered" as TextKey) || "{filtered} of {total}")
                    .replace("{filtered}", totalCount.toString())
                    .replace("{total}", overallCount.toString())
                : (t("driver_directory_count" as TextKey) || "Total: {total}")
                    .replace("{total}", overallCount.toString())
              }
            </div>
          )}
        </div>

        {activeTab === "DRIVERS" ? (
          <>
            {/* Filters Panel */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("search_driver_placeholder" as TextKey) || "Search..."}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900 text-base"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className="w-full sm:w-auto min-w-[200px]">
                  <SearchableBazarSelect
                    value={selectedBazar}
                    onChange={setSelectedBazar}
                    allowAll={true}
                    size="md"
                  />
                </div>
                {/* Vehicle Type Filter */}
                <div className="flex h-12 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 select-none w-full sm:w-auto justify-between sm:justify-start items-center">
                  {(["ALL", "CNG", "TOTO"] as const).map((type) => {
                    const isActive = selectedVehicleType === type;
                    const label =
                      type === "ALL"
                        ? (t("vehicle_all" as TextKey) || "All")
                        : type === "CNG"
                          ? (t("filter_cng" as TextKey) || "CNG")
                          : (t("filter_toto" as TextKey) || "Toto");
                    return (
                      <AppButton
                        key={type}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedVehicleType(type)}
                        className={`flex-1 sm:flex-none h-full px-4 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 text-center active:scale-100 ${isActive
                          ? "bg-white text-slate-900 shadow-sm hover:bg-white focus:ring-transparent focus:ring-offset-0"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-50/50 focus:ring-transparent focus:ring-offset-0"
                          }`}
                      >
                        {label}
                      </AppButton>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Count & Active Filters Row */}
            {((totalCount !== null && overallCount !== null) || (selectedBazar !== "ALL" || selectedVehicleType !== "ALL" || searchQuery !== "" || selectedContributor)) && (
              <div className="flex flex-wrap items-center gap-2 mb-8 select-none">
                {/* Mobile Count Pill */}
                {totalCount !== null && overallCount !== null && (
                  <div className="md:hidden flex items-center bg-slate-200/60 border border-slate-300/50 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs">
                    {totalCount < overallCount
                      ? (t("driver_directory_count_filtered" as TextKey) || "{filtered} of {total}")
                          .replace("{filtered}", totalCount.toString())
                          .replace("{total}", overallCount.toString())
                      : (t("driver_directory_count" as TextKey) || "Total: {total}")
                          .replace("{total}", overallCount.toString())
                    }
                  </div>
                )}

                {/* Search Filter Badge */}
                {searchQuery && (
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm animate-in fade-in duration-200">
                    <span>{t("search_label" as TextKey) || "Search"}: &quot;{searchQuery}&quot;</span>
                    <AppButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="h-auto w-auto p-0.5 hover:bg-emerald-100 rounded-full text-emerald-700 bg-transparent flex items-center justify-center focus:ring-0 focus:ring-offset-0 active:scale-95 min-h-0 min-w-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </AppButton>
                  </div>
                )}

                {/* Bazar Filter Badge */}
                {selectedBazar !== "ALL" && (
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm animate-in fade-in duration-200">
                    <span>{t("nearby_bazar" as TextKey) || "Bazar"}: {selectedBazar}</span>
                    <AppButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedBazar("ALL")}
                      className="h-auto w-auto p-0.5 hover:bg-emerald-100 rounded-full text-emerald-700 bg-transparent flex items-center justify-center focus:ring-0 focus:ring-offset-0 active:scale-95 min-h-0 min-w-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </AppButton>
                  </div>
                )}

                {/* Vehicle Type Filter Badge */}
                {selectedVehicleType !== "ALL" && (
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm animate-in fade-in duration-200">
                    <span>
                      {t("vehicle_type" as TextKey) || "Vehicle"}:{" "}
                      {selectedVehicleType === "TOTO"
                        ? (t("vehicle_toto" as TextKey) || "Toto")
                        : (t("vehicle_cng" as TextKey) || "CNG")}
                    </span>
                    <AppButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedVehicleType("ALL")}
                      className="h-auto w-auto p-0.5 hover:bg-emerald-100 rounded-full text-emerald-700 bg-transparent flex items-center justify-center focus:ring-0 focus:ring-offset-0 active:scale-95 min-h-0 min-w-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </AppButton>
                  </div>
                )}

                {/* Contributor Filter Badge */}
                {selectedContributor && (
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm animate-in fade-in duration-200">
                    <span>{t("contributed_by" as TextKey) || "Contributor"}: {selectedContributor.name}</span>
                    <AppButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedContributor(null)}
                      className="h-auto w-auto p-0.5 hover:bg-emerald-100 rounded-full text-emerald-700 bg-transparent flex items-center justify-center focus:ring-0 focus:ring-offset-0 active:scale-95 min-h-0 min-w-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </AppButton>
                  </div>
                )}

                {/* Clear All Button */}
                {(selectedBazar !== "ALL" || selectedVehicleType !== "ALL" || searchQuery !== "" || selectedContributor) && (
                  <AppButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedBazar("ALL");
                      setSelectedVehicleType("ALL");
                      setSelectedContributor(null);
                    }}
                    className="h-auto w-auto px-2 py-1 text-xs sm:text-sm font-bold text-slate-500 hover:text-primary hover:bg-transparent hover:underline bg-transparent active:scale-95 focus:ring-0 focus:ring-offset-0 min-h-0 min-w-0"
                  >
                    {t("clear_all" as TextKey) || "Clear All"}
                  </AppButton>
                )}
              </div>
            )}


            {/* Directory List Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 rounded-2xl bg-white animate-pulse border border-slate-200" />
                ))}
              </div>
            ) : drivers.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-semibold">{t("no_drivers_found" as TextKey) || "No drivers found."}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(isLanding ? drivers.slice(0, 9) : drivers).map((driver) => (
                    <div
                      key={driver.id}
                      className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 group relative overflow-hidden"
                    >
                      {/* Background Watermark Image */}
                      <div
                        className="absolute right-6 top-[56px] w-16 h-16 opacity-[0.25] md:opacity-[0.5] pointer-events-none transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 bg-contain bg-no-repeat bg-right-top"
                        style={{
                          backgroundImage: `url(${driver.vehicleType === "TOTO"
                            ? "/images/toto_watermark.avif"
                            : "/images/cng_watermark.png"
                            })`,
                        }}
                      />
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h4 className="text-base md:text-lg font-bold text-slate-900 group-hover:text-primary transition-colors leading-tight mb-1">
                              {driver.name}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${driver.vehicleType === "TOTO"
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              }`}>
                              {driver.vehicleType === "TOTO"
                                ? (t("vehicle_toto" as TextKey) || "Toto")
                                : (t("vehicle_cng" as TextKey) || "CNG")}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            {driver.nearbyBazar && (
                              <AppButton
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedBazar(driver.nearbyBazar || "ALL")}
                                className="h-auto w-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/60 hover:bg-slate-200 hover:text-slate-800 transition-colors active:scale-95 focus:ring-0 focus:ring-offset-0 min-h-0 min-w-0"
                              >
                                {driver.nearbyBazar}
                              </AppButton>
                            )}
                            {currentUser && driver.contributorHash === currentUser.phoneHash && (
                              <AppButton
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDriverToDelete(driver);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="h-auto w-auto p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 bg-transparent active:scale-95 focus:ring-0 focus:ring-offset-0 min-h-0 min-w-0"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </AppButton>
                            )}
                          </div>
                        </div>
                        <p className={`text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 ${driver.contributorName ? "mb-2" : "mb-4"}`}>
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span>{driver.address || driver.nearbyBazar || "—"}</span>
                        </p>
                        {driver.contributorName && (
                          <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
                            <span className="font-medium">{t("contributed_by" as TextKey) || "Contributed by"}:</span>
                            {driver.contributorHash ? (
                              <AppButton
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedContributor({
                                    name: driver.contributorName || "",
                                    hash: driver.contributorHash || "",
                                  });
                                }}
                                className="h-auto w-auto p-0 font-semibold text-slate-600 hover:text-primary hover:bg-transparent hover:underline transition-colors text-left active:scale-95 focus:ring-0 focus:ring-offset-0 min-h-0 min-w-0"
                              >
                                {driver.contributorName}
                              </AppButton>
                            ) : (
                              <span className="font-semibold text-slate-600">{driver.contributorName}</span>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5 font-mono text-slate-700 font-bold text-sm sm:text-base">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span>{driver.phone}</span>
                        </div>
                        <a href={`tel:${driver.phone}`} className="shrink-0">
                          <AppButton
                            variant="success"
                            size="sm"
                            className="rounded-lg h-9 px-4 font-bold bg-primary text-white hover:bg-success transition-all flex items-center gap-1.5"
                          >
                            <Phone className="w-4 h-4" />
                            <span>{t("call" as TextKey) || "Call"}</span>
                          </AppButton>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {isLanding && drivers.length > 9 && (
                  <div className="flex justify-center mt-10">
                    <Link href="/directory">
                      <AppButton
                        variant="outline"
                        className="group min-w-[220px] h-12 rounded-xl border-primary text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 font-bold shadow-sm"
                      >
                        <span>{t("view_all_drivers" as TextKey) || "View All Drivers"}</span>
                      </AppButton>
                    </Link>
                  </div>
                )}

                {!isLanding && (
                  <div ref={observerRef} className="py-10 flex justify-center w-full min-h-[80px]">
                    {isFetchingNext && (
                      <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-full border border-slate-200/80 shadow-sm animate-pulse">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                        </span>
                        <span className="text-sm font-bold text-slate-600">
                          {t("loading" as TextKey) || "Loading more..."}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          /* Leaderboard UI */
          isLeaderboardLoading ? (
            <div className="space-y-4 max-w-2xl mx-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-white animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 max-w-2xl mx-auto">
              <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-semibold">{t("leaderboard_empty" as TextKey) || "No contributors yet."}</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
              {leaderboard.map((entry, index) => {
                const rank = index + 1;
                const badgeColor =
                  rank === 1
                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                    : rank === 2
                      ? "bg-slate-100 text-slate-700 border border-slate-200"
                      : rank === 3
                        ? "bg-orange-100 text-orange-700 border border-orange-200"
                        : "bg-slate-50 text-slate-500 border border-slate-100";

                const safeName = entry.name || "Anonymous";
                const initials = safeName.slice(0, 1).toUpperCase() || "?";

                const colors = [
                  "bg-emerald-100 text-emerald-800",
                  "bg-blue-100 text-blue-800",
                  "bg-purple-100 text-purple-800",
                  "bg-rose-100 text-rose-800",
                  "bg-amber-100 text-amber-800",
                  "bg-indigo-100 text-indigo-800"
                ];
                const charCode = safeName.charCodeAt(0);
                const colorIndex = isNaN(charCode) ? 0 : charCode % colors.length;
                const avatarColor = colors[colorIndex];

                return (
                  <AppButton
                    key={entry.phone}
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => {
                      if (entry.hash) {
                        setSelectedContributor({
                          name: entry.name,
                          hash: entry.hash
                        });
                        setActiveTab("DRIVERS");
                      }
                    }}
                    className="w-full h-auto p-4 sm:p-5 flex items-center justify-between gap-3 text-slate-900 hover:bg-slate-50/50 transition-colors text-left font-normal bg-transparent active:scale-100 rounded-none focus:ring-0 focus:ring-offset-0 min-h-0 min-w-0"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                      {/* Rank Badge */}
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${badgeColor}`}>
                        {rank}
                      </span>

                      {/* Profile Picture */}
                      {entry.photoUrl ? (
                        <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-100 shrink-0">
                          <Image
                            src={entry.photoUrl}
                            alt={entry.name}
                            fill
                            sizes="(max-width: 640px) 40px, 48px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-extrabold text-sm sm:text-lg shadow-inner shrink-0 ${avatarColor}`}>
                          {initials}
                        </div>
                      )}

                      {/* Contributor Name & Masked Phone */}
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 leading-snug flex items-center gap-1.5 text-sm sm:text-base truncate">
                          <span className="truncate">{entry.name}</span>
                          {rank === 1 && <Trophy className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />}
                        </h4>
                        <p className="text-xs text-slate-400 font-mono font-medium">{entry.phone}</p>
                      </div>
                    </div>

                    {/* Contribution Count */}
                    <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl border border-emerald-100/50 font-bold text-[10px] sm:text-xs md:text-sm shrink-0">
                      <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>
                        {entry.count} {t("leaderboard_contributions" as TextKey) || "contributions"}
                      </span>
                    </div>
                  </AppButton>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Contributor Form Modal */}
      {isSubmitModalOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[80vh] md:max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
              <h3 className="text-xl font-bold text-slate-900">
                {t("contribute_title" as TextKey) || "Add Driver Info"}
              </h3>
              <AppButton
                variant="ghost"
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors min-h-[auto] h-auto px-2"
              >
                <X className="w-5 h-5" />
              </AppButton>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 overflow-y-auto flex-1">
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-2">
                {t("contribute_desc" as TextKey) || "Help by adding driver numbers."}
              </p>

              {!currentUser && (
                <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex gap-2.5 items-start">
                    <Trophy className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-amber-900 leading-relaxed">
                      {t("guest_contribution_prompt" as TextKey) || "Login to get credit on the leaderboard, or continue as a guest."}
                    </p>
                  </div>
                  <Link href="/login" className="shrink-0">
                    <AppButton
                      type="button"
                      variant="outline"
                      className="h-8 text-xs px-3.5 border-amber-200 hover:border-amber-300 text-amber-950 bg-white/50 hover:bg-white rounded-lg font-bold min-h-[auto]"
                    >
                      {t("login_to_contribute" as TextKey) || "Login First"}
                    </AppButton>
                  </Link>
                </div>
              )}

              <FormField
                label={t("driver_name" as TextKey) || "Driver Name"}
                placeholder="মকবুল হোসেন"
                error={errors.name?.message}
                required
                {...register("name")}
              />

              <FormField
                label={t("driver_phone" as TextKey) || "Phone Number"}
                placeholder="01712345678"
                error={errors.phone?.message}
                required
                {...register("phone")}
              />

              <FormField
                label={t("driver_address" as TextKey) || "Address"}
                placeholder="পশ্চিম ছাগলনাইয়া, ফেনী"
                error={errors.address?.message}
                {...register("address")}
              />

              {/* Bazar Selection */}
              <Controller
                control={control}
                name="nearbyBazar"
                render={({ field }) => (
                  <SearchableBazarSelect
                    label={t("select_bazar" as TextKey) || "Stand/Bazar"}
                    required
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.nearbyBazar?.message}
                  />
                )}
              />

              {/* Vehicle Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">
                  {t("vehicle_type_label" as TextKey) || "Vehicle Type"}
                </label>
                <div className="flex gap-4">
                  {(["CNG", "TOTO"] as const).map((type) => {
                    const label = type === "CNG"
                      ? (t("vehicle_cng" as TextKey) || "CNG")
                      : (t("vehicle_toto" as TextKey) || "Toto / Auto Rickshaw");
                    const isSelected = watchedVehicleType === type;
                    const imgSrc = type === "TOTO"
                      ? "/images/toto_watermark.avif"
                      : "/images/cng_watermark.png";
                    return (
                      <label
                        key={type}
                        className={`flex-1 flex items-center justify-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 font-bold text-sm select-none ${isSelected
                          ? "border-primary bg-emerald-50/30 text-emerald-800 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50/50"
                          }`}
                      >
                        <input
                          type="radio"
                          value={type}
                          className="sr-only"
                          {...register("vehicleType")}
                        />
                        <div className={`relative w-8 h-8 flex items-center justify-center rounded-lg p-1 transition-transform duration-200 ${isSelected ? "scale-110 bg-white shadow-sm" : "opacity-80"
                          }`}>
                          <Image
                            src={imgSrc}
                            alt={type}
                            width={24}
                            height={24}
                            className="object-contain"
                          />
                        </div>
                        <span className="leading-tight">{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <AppButton
                  type="button"
                  variant="ghost"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="flex-1 h-12 rounded-xl text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </AppButton>
                <AppButton
                  type="submit"
                  loading={isSubmitting}
                  disabled={uploading}
                  className="flex-1 h-12 rounded-xl bg-primary text-white font-bold hover:bg-success shadow-lg transition-all"
                >
                  {t("submit" as TextKey) || "Submit"}
                </AppButton>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
        {isDeleteModalOpen && driverToDelete && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-slate-900 mb-2 font-bn">
                {t("delete_confirm_title" as TextKey)}
              </h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                {t("delete_confirm_desc" as TextKey)}
              </p>
              <div className="flex gap-3 justify-end">
                <AppButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDriverToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl px-4 py-2.5 h-11"
                >
                  {t("cancel" as TextKey) || "Cancel"}
                </AppButton>
                <AppButton
                  type="button"
                  variant="outline"
                  onClick={handleDeleteDriver}
                  disabled={isDeleting}
                  className="font-bold bg-rose-600 text-white hover:bg-rose-700 border-transparent hover:border-transparent rounded-xl px-4 py-2.5 h-11"
                >
                  {isDeleting ? (t("loading" as TextKey) || "Deleting...") : (t("delete" as TextKey) || "Delete")}
                </AppButton>
              </div>
            </div>
          </div>,
          document.body
        )}
      </Section>
    );
  }
