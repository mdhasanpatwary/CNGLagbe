"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, Calendar, Save, CheckCircle2, CreditCard, Hash, BadgeCheck, MapPin, Lock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppButton } from "@/components/ui/AppButton";
import { useLang } from "@/hooks/useLang";
import { FormField } from "@/components/FormField";
import { apiFetch } from "@/utils/api";
import { Header } from "@/components/layout/Header";
import { PageHeading } from "@/components/ui/PageHeading";
import { User as UserType } from "@/lib/types/user";
import { cn } from "@/lib/utils";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { driverProfileSchema, type DriverProfileInput } from "@/lib/schemas/driver-profile";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Controller } from "react-hook-form";
import { ProfileSkeleton } from "@/components/ui/AppSkeletons";

export default function DriverProfilePage() {
  const router = useRouter();
  const { t } = useLang();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [bazars, setBazars] = useState<string[]>([]);

  useEffect(() => {
    const fetchBazars = async () => {
      try {
        const res = await fetch("/api/bazars");
        if (res.ok) {
          const data = await res.json();
          setBazars(data.map((b: { name: string }) => b.name));
        }
      } catch (error) {
        console.error("Failed to fetch bazars:", error);
      }
    };
    fetchBazars();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<DriverProfileInput>({
    resolver: zodResolver(driverProfileSchema),
    defaultValues: {
      name: "",
      photoUrl: "",
      birthday: "",
      nidNumber: "",
      licenseNumber: "",
      vehicleNumber: "",
      address: "",
      nearbyBazar: "",
    },
  });

  const photoUrl = useWatch({ control, name: "photoUrl" });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiFetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          const userData: UserType = data.user;
          setUser(userData);
          reset({
            name: userData.name || "",
            photoUrl: userData.photoUrl || "",
            birthday: userData.birthday ? new Date(userData.birthday).toISOString().split("T")[0] : "",
            nidNumber: userData.nidNumber || "",
            licenseNumber: userData.licenseNumber || "",
            vehicleNumber: userData.vehicleNumber || "",
            address: userData.address || "",
            nearbyBazar: userData.nearbyBazar || "",
          });
        } else {
          router.push("/driver/login");
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router, reset]);

  const onSubmit = async (data: DriverProfileInput) => {
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await apiFetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || (t("error") as string));
      }
    } catch (err) {
      console.error("Update error:", err);
      setError(t("network_error") as string);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center">
        <Header role="driver" user={null} />
        <main className="p-6 w-full max-w-md">
          <PageHeading title={t("profile")} subtitle={t("driver_portal")} />
          <Card className="border-none rounded-3xl overflow-hidden mb-8 bg-white/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <ProfileSkeleton />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <Header
        role="driver"
        theme="light"
        user={user}
        className="w-full"
      />

      <main className="p-6 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <PageHeading
          title={t("profile")}
          subtitle={t("driver_portal")}
          backHref="/driver/dashboard"
        />
        <Card className="shadow-2xl shadow-slate-200/50 border-none rounded-3xl overflow-visible mb-8">
          <div className="bg-primary h-2 w-full rounded-t-3xl" />
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Security Notice */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-amber-700 leading-relaxed">
                  {t("profile_locked_notice")}
                </p>
              </div>

              {/* Photo Section */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 overflow-hidden border-4 border-white shadow-xl relative">
                    {photoUrl ? (
                      <Image
                        src={photoUrl}
                        alt="Profile"
                        fill
                        className="object-cover object-top transition-all duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <User size={48} />
                      </div>
                    )}

                  </div>


                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-200 text-slate-500 rounded-xl shadow-lg flex items-center justify-center cursor-not-allowed">
                    <Lock size={18} />
                  </div>
                </div>
                <div className="flex flex-col items-center mt-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {t("profile_photo")}
                  </p>
                  {user?.isApproved && (
                    <div className="mt-2 flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-100">
                      <BadgeCheck size={14} className="fill-green-600 text-white" />
                      <span className="text-[10px] font-black uppercase tracking-wider">{t("approved")}</span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm border border-red-100 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-primary/10 text-primary p-4 rounded-xl text-sm border border-primary/20 flex items-center gap-3 animate-in zoom-in-95">
                  <CheckCircle2 size={18} />
                  {t("update_success")}
                </div>
              )}

              <div className="space-y-6">
                <FormField
                  label={t("full_name")}
                  icon={User}
                  placeholder="Your Name"
                  {...register("name")}
                  error={errors.name?.message}
                  disabled
                />

                <div className="space-y-2">
                  <label className="text-xs font-black tracking-widest text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-400" />
                    {t("birthday")}
                    <Lock size={12} className="text-slate-400" />
                  </label>
                  <input
                    type="date"
                    {...register("birthday")}
                    disabled
                    className={cn(
                      "w-full h-14 bg-slate-100 border border-slate-200 rounded-2xl px-4 text-sm font-bold text-slate-400 cursor-not-allowed outline-none transition-all opacity-80",
                      errors.birthday && "bg-red-50 ring-2 ring-red-500/20"
                    )}
                  />
                  {errors.birthday && (
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">
                      {errors.birthday.message}
                    </span>
                  )}
                </div>

                <FormField
                  label={t("nid_number")}
                  icon={CreditCard}
                  placeholder="1234567890"
                  {...register("nidNumber")}
                  error={errors.nidNumber?.message}
                  disabled
                />

                <FormField
                  label={t("license_number")}
                  icon={Hash}
                  placeholder="LIC-12345"
                  {...register("licenseNumber")}
                  error={errors.licenseNumber?.message}
                  disabled
                />

                <FormField
                  label={t("address")}
                  icon={MapPin}
                  placeholder="Vill, Post, Upazila"
                  {...register("address")}
                  error={errors.address?.message}
                />

                <Controller
                  name="nearbyBazar"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      label={t("nearby_bazar")}
                      options={bazars}
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder={t("nearby_bazar")}
                      error={errors.nearbyBazar?.message}
                      icon={MapPin}
                    />
                  )}
                />

                <FormField
                  label={t("vehicle_number")}
                  icon={BadgeCheck}
                  placeholder="FENI-THA-11-2222"
                  {...register("vehicleNumber")}
                  error={errors.vehicleNumber?.message}
                  disabled
                />

                <div className="pt-4 border-t border-slate-100">
                  <FormField
                    label={t("set_password")}
                    icon={Lock}
                    type="password"
                    placeholder="••••••"
                    {...register("password")}
                    error={errors.password?.message}
                  />
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1 mt-1">
                    Leave blank to keep current password
                  </p>
                </div>
              </div>


              <AppButton
                type="submit"
                loading={saving}
                className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary-dark text-white"
                leftIcon={!saving && <Save size={20} />}
              >
                {t("save_changes")}
              </AppButton>
            </form>
          </CardContent>
        </Card>

        <AppButton
          variant="ghost"
          onClick={() => {
            document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            router.push("/driver/login");
          }}
          className="w-full h-14 text-slate-400 hover:text-red-500 hover:bg-red-50 font-bold rounded-2xl transition-all"
        >
          {t("logout")}
        </AppButton>
      </main>
    </div>
  );
}
