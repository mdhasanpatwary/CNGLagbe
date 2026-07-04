"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, MapPin, Phone, Users, Plus, X } from "lucide-react";
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

interface ContributedDriver {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  nearbyBazar: string | null;
}

export function DriverDirectorySection() {
  const { t } = useLang();
  const [drivers, setDrivers] = useState<ContributedDriver[]>([]);
  const [selectedBazar, setSelectedBazar] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Form setup
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ContributedDriverInput>({
    resolver: zodResolver(contributedDriverSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      nearbyBazar: "",
    }
  });

  // Fetch Drivers based on filters
  const fetchDrivers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBazar !== "ALL") params.append("bazar", selectedBazar);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/contributed-drivers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDrivers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBazar, searchQuery]);

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

  // Fetch drivers on filter changes
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDrivers();
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchDrivers]);

  const onSubmit = async (data: ContributedDriverInput) => {
    setIsSubmitting(true);
    try {
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
        fetchDrivers();
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
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100/80">
              ⚡ {t("demo_tag" as TextKey) || "Live"} Directory
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight font-bn leading-tight">
              {t("driver_directory" as TextKey) || "CNG Driver List"}
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed max-w-xl">
              {t("cng_desc" as TextKey) || "আপনার এলাকার সিএনজি ড্রাইভার খুজুন"}
            </p>
          </div>
          <AppButton
            onClick={() => setIsSubmitModalOpen(true)}
            leftIcon={<Plus className="w-5 h-5" />}
            className="h-12 px-6 rounded-xl bg-primary hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-600/20 transition-all shrink-0 self-start md:self-end"
          >
            {t("add_driver_local" as TextKey) || "Add Driver"}
          </AppButton>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search_driver_placeholder" as TextKey) || "Search..."}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900"
            />
          </div>
          <div className="w-full sm:w-auto min-w-[240px]">
            <SearchableBazarSelect
              value={selectedBazar}
              onChange={setSelectedBazar}
              allowAll={true}
            />
          </div>
        </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h4 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors leading-tight">
                      {driver.name}
                    </h4>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                      {driver.nearbyBazar}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-4">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{driver.address || "—"}</span>
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 font-mono text-slate-700 font-bold text-base">
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
