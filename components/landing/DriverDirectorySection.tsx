"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, MapPin, Phone, Users, Plus, X, Trophy, Camera } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contributedDriverSchema, ContributedDriverInput } from "@/lib/schemas/contributed-driver";
import { AppButton } from "@/components/ui/AppButton";
import { FormField } from "@/components/FormField";
import { toast } from "sonner";
import { useLang } from "@/hooks/useLang";
import { TextKey } from "@/constants/text";
import { Section } from "@/components/ui/Section";
import { SearchableBazarSelect } from "@/components/ui/SearchableBazarSelect";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { User } from "@/lib/types/user";

interface ContributedDriver {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  nearbyBazar: string | null;
  vehicleType: string;
  contributorName?: string | null;
  contributorHash?: string | null;
  contributorPhotoUrl?: string | null;
}

interface LeaderboardEntry {
  name: string;
  phone: string;
  photoUrl: string | null;
  count: number;
  hash: string;
}

interface DriverDirectorySectionProps {
  isLanding?: boolean;
}

export function DriverDirectorySection({ isLanding = false }: DriverDirectorySectionProps) {
  const { t } = useLang();
  const [drivers, setDrivers] = useState<ContributedDriver[]>([]);
  const [selectedBazar, setSelectedBazar] = useState("ALL");
  const [selectedVehicleType, setSelectedVehicleType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Leaderboard states
  const [activeTab, setActiveTab] = useState<"DRIVERS" | "LEADERBOARD">("DRIVERS");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedContributor, setSelectedContributor] = useState<{ name: string; hash: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => setCurrentUser(null));
  }, []);

  // Form setup
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContributedDriverInput>({
    resolver: zodResolver(contributedDriverSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      nearbyBazar: "",
      vehicleType: "CNG",
      contributorName: "",
      contributorPhone: "",
      contributorPhotoUrl: "",
    }
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchedVehicleType = watch("vehicleType", "CNG");
  const watchedContributorPhotoUrl = watch("contributorPhotoUrl", "");

  useEffect(() => {
    if (isSubmitModalOpen && currentUser) {
      setValue("contributorName", currentUser.name || "");
      setValue("contributorPhone", currentUser.phone || "");
      setValue("contributorPhotoUrl", currentUser.photoUrl || "");
    }
  }, [isSubmitModalOpen, currentUser, setValue]);

  const fetchLeaderboard = useCallback(async () => {
    setIsLeaderboardLoading(true);
    try {
      const res = await fetch("/api/contributed-drivers/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (e) {
      console.error("Leaderboard fetch error:", e);
    } finally {
      setIsLeaderboardLoading(false);
    }
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `contributor-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("drivers")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("drivers")
        .getPublicUrl(filePath);

      setValue("contributorPhotoUrl", publicUrl);
      toast.success(t("uploaded" as TextKey) || "Photo uploaded!");
    } catch (err) {
      console.error("Photo upload error:", err);
      toast.error(t("upload_failed" as TextKey) || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "LEADERBOARD") {
      fetchLeaderboard();
    }
  }, [activeTab, fetchLeaderboard]);

  // Fetch Drivers based on filters
  const fetchDrivers = useCallback(async (pageNum: number, signal?: AbortSignal) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsFetchingNext(true);
    }

    try {
      const params = new URLSearchParams();
      if (selectedBazar !== "ALL") params.append("bazar", selectedBazar);
      if (selectedVehicleType !== "ALL") params.append("vehicleType", selectedVehicleType);
      if (searchQuery) params.append("search", searchQuery);
      if (selectedContributor) params.append("contributorHash", selectedContributor.hash);

      if (isLanding) {
        params.append("limit", "10");
        params.append("page", "1");
      } else {
        params.append("limit", "12");
        params.append("page", pageNum.toString());
      }

      const res = await fetch(`/api/contributed-drivers?${params.toString()}`, { signal });
      if (res.ok) {
        const data = await res.json();
        if (isLanding) {
          setDrivers(data);
          setHasMore(false);
        } else {
          if (pageNum === 1) {
            setDrivers(data);
          } else {
            setDrivers((prev) => [...prev, ...data]);
          }
          setHasMore(data.length === 12);
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") {
        console.error(e);
      }
    } finally {
      if (!signal || !signal.aborted) {
        setIsLoading(false);
        setIsFetchingNext(false);
      }
    }
  }, [selectedBazar, selectedVehicleType, searchQuery, isLanding, selectedContributor]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isSubmitModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSubmitModalOpen]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [selectedBazar, selectedVehicleType, searchQuery, selectedContributor]);

  // Fetch drivers on page or filter changes
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let handler: NodeJS.Timeout;

    if (page === 1) {
      handler = setTimeout(() => {
        fetchDrivers(1, controller.signal);
      }, 300);
    } else {
      fetchDrivers(page, controller.signal);
    }

    return () => {
      if (handler) clearTimeout(handler);
      controller.abort();
    };
  }, [page, selectedBazar, selectedVehicleType, searchQuery, selectedContributor, fetchDrivers]);

  // Setup Intersection Observer for Infinite Scroll
  useEffect(() => {
    if (isLanding || !hasMore || isLoading || isFetchingNext || activeTab !== "DRIVERS") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isLanding, hasMore, isLoading, isFetchingNext, activeTab]);

  const onSubmit = async (data: ContributedDriverInput) => {
    setIsSubmitting(true);
    try {
      if (currentUser) {
        data.contributorName = currentUser.name || "";
        data.contributorPhone = currentUser.phone || "";
        data.contributorPhotoUrl = currentUser.photoUrl || "";
      }

      const res = await fetch("/api/contributed-drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await res.json();

      if (res.ok) {
        toast.success(
          resData.autoApproved
            ? (t("success_contribute" as TextKey) || "Driver added successfully!")
            : (t("success_contribute_pending" as TextKey) || "Submitted for approval!")
        );
        reset();
        setIsSubmitModalOpen(false);
        fetchDrivers(1);

        if (resData.autoLoggedIn) {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else if (resData.error === "PHONE_EXISTS") {
        toast.error(t("error_phone_exists" as TextKey) || "Phone number already exists!");
      } else {
        toast.error("Failed to add driver. Try again.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error submitting form.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="flex border-b border-slate-200 mb-8 gap-4 shrink-0 overflow-x-auto scrollbar-none">
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

            {/* Active Filters Row */}
            {(selectedBazar !== "ALL" || selectedVehicleType !== "ALL" || searchQuery !== "" || selectedContributor) && (
              <div className="flex flex-wrap items-center gap-2 mb-8 select-none">
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
                          {driver.nearbyBazar && (
                            <AppButton
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedBazar(driver.nearbyBazar || "ALL")}
                              className="h-auto w-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/60 hover:bg-slate-200 hover:text-slate-800 transition-colors shrink-0 active:scale-95 focus:ring-0 focus:ring-offset-0 min-h-0 min-w-0"
                            >
                              {driver.nearbyBazar}
                            </AppButton>
                          )}
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

              {/* Contributor Information Section */}
              <div className={`border-t border-slate-100 pt-5 space-y-4 ${currentUser ? "hidden" : ""}`}>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>অবদানকারীর তথ্য (Contributor Info)</span>
                </h4>

                {/* Profile Photo Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">
                    {t("contributor_photo_label" as TextKey) || "Your Photo (Optional)"}
                  </label>
                  {currentUser ? (
                    currentUser.photoUrl ? (
                      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                          <Image
                            src={currentUser.photoUrl}
                            alt="Contributor"
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <p className="text-xs text-slate-500 font-medium">আপনার প্রোফাইল ছবি ব্যবহার করা হবে (Using your profile picture)</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 font-medium bg-slate-50 p-3 rounded-xl border border-slate-200/60">আপনার একাউন্ট থেকে তথ্য নেওয়া হচ্ছে (Using account details)</p>
                    )
                  ) : (
                    <div className="flex items-center gap-4">
                      <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/10 cursor-pointer transition-all text-xs font-bold text-slate-600 hover:text-emerald-800 select-none">
                        <Camera className="w-4 h-4" />
                        <span>{uploading ? "Uploading..." : (t("upload_photo" as TextKey) || "Upload Photo")}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                      {watchedContributorPhotoUrl && (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200">
                          <Image
                            src={watchedContributorPhotoUrl}
                            alt="Contributor Preview"
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <FormField
                  label={t("contributor_name_label" as TextKey) || "Your Name"}
                  placeholder="আপনার নাম লিখুন"
                  error={errors.contributorName?.message}
                  required
                  disabled={!!currentUser}
                  {...register("contributorName")}
                />

                <div className="space-y-1">
                  <FormField
                    label={t("contributor_phone_label" as TextKey) || "Your Mobile Number"}
                    placeholder="01712345678"
                    error={errors.contributorPhone?.message}
                    required
                    disabled={!!currentUser}
                    {...register("contributorPhone")}
                  />
                  <p className="text-[10px] text-slate-400 font-medium">
                    * {t("contributor_phone_disclaimer" as TextKey) || "Mobile number will be masked on the leaderboard"}
                  </p>
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
    </Section>
  );
}
