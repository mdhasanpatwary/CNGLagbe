"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2, User, Phone, MapPin, Camera, X, Check } from "lucide-react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppButton } from "@/components/ui/AppButton";
import { useLang } from "@/hooks/useLang";
import { FormField } from "@/components/FormField";
import { supabase } from "@/lib/supabase";
import { SearchableSelect } from "@/components/SearchableSelect";
import { contributedDriverEditSchema, type ContributedDriverEditInput } from "@/lib/schemas/contributed-driver";
import { type ContributedDriver } from "../../hooks/useAdminDashboard";
import { type TextKey } from "@/constants/text";

interface Contributor {
  name: string;
  phone: string;
  photoUrl: string | null;
}

interface ContributedDriverEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver?: ContributedDriver | null;
  onSuccess: () => void;
  onUpdate: (id: string, data: Partial<ContributedDriver>) => Promise<boolean>;
  bazars: string[];
  contributors: Contributor[];
}

export function ContributedDriverEditModal({
  isOpen,
  onClose,
  driver,
  onSuccess,
  onUpdate,
  bazars,
  contributors,
}: ContributedDriverEditModalProps) {
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [selectedContributorPhone, setSelectedContributorPhone] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<ContributedDriverEditInput>({
    resolver: zodResolver(contributedDriverEditSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      nearbyBazar: "",
      vehicleType: "CNG",
      isApproved: false,
      contributorName: "",
      contributorPhone: "",
      contributorPhotoUrl: "",
    },
  });

  useEffect(() => {
    if (driver) {
      reset({
        name: driver.name || "",
        phone: driver.phone || "",
        address: driver.address || "",
        nearbyBazar: driver.nearbyBazar || "",
        vehicleType: (driver.vehicleType as "CNG" | "TOTO") || "CNG",
        isApproved: driver.isApproved || false,
        contributorName: driver.contributorName || "",
        contributorPhone: driver.contributorPhone || "",
        contributorPhotoUrl: driver.contributorPhotoUrl || "",
      });

      if (driver.contributorPhone) {
        const matched = contributors.find(c => c.phone === driver.contributorPhone);
        if (matched) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSelectedContributorPhone(driver.contributorPhone);
        } else {
          setSelectedContributorPhone("new");
        }
      } else {
        setSelectedContributorPhone("");
      }
    } else {
      reset({
        name: "",
        phone: "",
        address: "",
        nearbyBazar: "",
        vehicleType: "CNG",
        isApproved: false,
        contributorName: "",
        contributorPhone: "",
        contributorPhotoUrl: "",
      });
      setSelectedContributorPhone("");
    }
    setServerError("");
  }, [driver, reset, isOpen, contributors]);

  const handleContributorChange = (phone: string) => {
    setSelectedContributorPhone(phone);
    if (phone === "new") {
      setValue("contributorName", "");
      setValue("contributorPhone", "");
      setValue("contributorPhotoUrl", "");
    } else if (phone === "") {
      setValue("contributorName", "");
      setValue("contributorPhone", "");
      setValue("contributorPhotoUrl", "");
    } else {
      const selected = contributors.find(c => c.phone === phone);
      if (selected) {
        setValue("contributorName", selected.name);
        setValue("contributorPhone", selected.phone);
        setValue("contributorPhotoUrl", selected.photoUrl || "");
      }
    }
  };

  const contributorPhotoUrl = useWatch({ control, name: "contributorPhotoUrl" });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setServerError("");

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
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Photo upload error:", error);
      setServerError(t("upload_failed" as TextKey) || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ContributedDriverEditInput) => {
    if (!driver) return;
    setLoading(true);
    setServerError("");

    try {
      const success = await onUpdate(driver.id, {
        name: data.name,
        phone: data.phone,
        address: data.address || null,
        nearbyBazar: data.nearbyBazar,
        vehicleType: data.vehicleType,
        isApproved: data.isApproved,
        contributorName: data.contributorName || null,
        contributorPhone: data.contributorPhone || null,
        contributorPhotoUrl: data.contributorPhotoUrl || null,
      });

      if (success) {
        onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      const error = err as Error;
      setServerError(error.message || t("network_error" as TextKey) || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
              {t("edit_contributed_driver" as TextKey) || "Edit Contributed Driver"}
            </h3>
          </div>
          <AppButton
            variant="ghost"
            onClick={onClose}
            className="w-10 h-10 p-0 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </AppButton>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
              <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm border border-red-100 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                {serverError === "PHONE_EXISTS" ? "Phone number already exists!" : serverError}
              </div>
            )}

            {/* Section: Driver Info */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
                <User size={14} /> {t("driver_info" as TextKey) || "Driver Info"}
              </h4>

              <FormField
                label={t("full_name" as TextKey) || "Driver Name"}
                icon={User}
                placeholder="Karim Mia"
                {...register("name")}
                error={errors.name?.message}
              />

              <FormField
                label={t("phone_number" as TextKey) || "Phone Number"}
                icon={Phone}
                type="tel"
                placeholder="01711XXXXXX"
                {...register("phone")}
                error={errors.phone?.message}
              />

              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="nearbyBazar"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      label={t("nearby_bazar" as TextKey) || "Bazar"}
                      options={bazars}
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder={t("nearby_bazar" as TextKey) || "Select Bazar"}
                      error={errors.nearbyBazar?.message}
                      icon={MapPin}
                    />
                  )}
                />

                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    {t("vehicle_type" as TextKey) || "Vehicle Type"}
                  </label>
                  <Controller
                    name="vehicleType"
                    control={control}
                    render={({ field }) => (
                      <select
                        value={field.value}
                        onChange={field.onChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900 bg-white"
                      >
                        <option value="CNG">CNG</option>
                        <option value="TOTO">Toto</option>
                      </select>
                    )}
                  />
                </div>
              </div>

              <FormField
                label={t("address" as TextKey) || "Address"}
                icon={MapPin}
                placeholder="Vill, Post, Upazila"
                {...register("address")}
                error={errors.address?.message}
              />

              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <input
                  type="checkbox"
                  id="isApproved"
                  {...register("isApproved")}
                  className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isApproved" className="text-sm font-bold text-slate-700 select-none cursor-pointer">
                  {t("contributed_approved" as TextKey) || "Approved & Visible in Directory"}
                </label>
              </div>
            </div>

            {/* Section: Contributor Info */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
                <User size={14} /> {t("contributor_info" as TextKey) || "Contributor Info"}
              </h4>

              {/* Contributor Dropdown Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  {t("choose_contributor" as TextKey) || "Choose Contributor"}
                </label>
                <select
                  value={selectedContributorPhone}
                  onChange={(e) => handleContributorChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900 bg-white"
                >
                  <option value="">{t("no_contributor" as TextKey) || "No Contributor (None)"}</option>
                  <option value="new">{t("new_contributor" as TextKey) || "Add New Contributor"}</option>
                  {contributors.map((c) => (
                    <option key={c.phone} value={c.phone}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Contributor Name */}
              <FormField
                label={t("contributor_name_label" as TextKey) || "Contributor Name"}
                icon={User}
                placeholder="Contributor Name"
                {...register("contributorName")}
                error={errors.contributorName?.message}
                disabled={selectedContributorPhone !== "" && selectedContributorPhone !== "new"}
              />

              {/* Contributor Phone */}
              <FormField
                label={t("contributor_phone_label" as TextKey) || "Contributor Phone"}
                icon={Phone}
                type="tel"
                placeholder="01711XXXXXX"
                {...register("contributorPhone")}
                error={errors.contributorPhone?.message}
                disabled={selectedContributorPhone !== "" && selectedContributorPhone !== "new"}
              />

              {/* Contributor Photo Upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  {t("contributor_photo_label" as TextKey) || "Contributor Photo"}
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0 flex items-center justify-center">
                    {contributorPhotoUrl ? (
                      <Image
                        src={contributorPhotoUrl}
                        alt="Contributor"
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      id="contributorPhoto"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={selectedContributorPhone !== "" && selectedContributorPhone !== "new"}
                    />
                    <label
                      htmlFor={selectedContributorPhone !== "" && selectedContributorPhone !== "new" ? undefined : "contributorPhoto"}
                      className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 transition-colors ${selectedContributorPhone !== "" && selectedContributorPhone !== "new" ? "opacity-50 cursor-not-allowed bg-slate-50" : "hover:bg-slate-50 active:bg-slate-100 cursor-pointer"}`}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-slate-500" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                          Change Photo
                        </>
                      )}
                    </label>
                    {contributorPhotoUrl && (selectedContributorPhone === "new" || selectedContributorPhone === "") && (
                      <AppButton
                        type="button"
                        variant="ghost"
                        onClick={() => setValue("contributorPhotoUrl", "")}
                        className="block text-xs font-bold text-red-500 hover:text-red-600 hover:bg-transparent transition-colors p-0 min-h-[auto] h-auto"
                      >
                        Remove Photo
                      </AppButton>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <AppButton
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1 h-14 rounded-2xl"
              >
                Cancel
              </AppButton>
              <AppButton
                type="submit"
                loading={loading}
                disabled={loading || uploading}
                className="flex-1 h-14 bg-primary hover:bg-primary-dark text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
                leftIcon={<Check className="w-5 h-5" />}
              >
                Save
              </AppButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
