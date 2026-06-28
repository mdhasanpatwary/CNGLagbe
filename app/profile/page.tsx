"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, Camera, Calendar, Save, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { AppButton } from "@/components/ui/AppButton";
import { useLang } from "@/hooks/useLang";
import { FormField } from "@/components/FormField";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/utils/api";
import { Header } from "@/components/layout/Header";
import { PageHeading } from "@/components/ui/PageHeading";
import { User as UserType } from "@/lib/types/user";
import { cn } from "@/lib/utils";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileInput } from "@/lib/schemas/profile";
import { ProfileSkeleton } from "@/components/ui/AppSkeletons";

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useLang();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      photoUrl: "",
      birthday: "",
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
          });
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router, reset]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('drivers') // Using 'drivers' bucket for simplicity as it already exists/is planned
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('drivers')
        .getPublicUrl(filePath);

      setValue("photoUrl", publicUrl);
    } catch (err: unknown) {
      console.error("Upload error:", err);
      toast.error(t("upload_failed") as string);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProfileInput) => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success(t("update_success") as string);
      } else {
        const data = await res.json();
        toast.error(data.error || (t("error") as string));
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error(t("network_error") as string);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen premium-bg-surface flex flex-col items-center relative overflow-hidden">
        <Header role="user" user={null} />
        <main className="p-6 w-full max-w-md">
          <PageHeading title={t("profile")} subtitle={t("app_name")} />
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
    <div className="min-h-screen premium-bg-surface flex flex-col items-center relative overflow-hidden">
      {/* Texture Overlay */}
      <div className="absolute inset-0 dot-grid-texture opacity-50 pointer-events-none" />
      
      <Header
        role="user"
        theme="light"
        user={user}
        className="w-full"
      />

      <main className="p-6 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <PageHeading
          title={t("profile")}
          subtitle={t("app_name")}
          backHref="/user"
        />
        <Card className="shadow-2xl shadow-slate-200/50 border-none rounded-3xl overflow-hidden mb-8">
          <div className="bg-primary h-2 w-full" />
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Photo Section */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 overflow-hidden border-4 border-white shadow-xl relative">
                    {photoUrl ? (
                      <Image
                        src={photoUrl}
                        alt="Profile"
                        fill
                        sizes="128px"
                        className="object-cover object-top transition-all duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <User size={48} />
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="profile-photo-upload"
                  />
                  <label
                    htmlFor="profile-photo-upload"
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-xl shadow-lg flex items-center justify-center cursor-pointer hover:bg-primary-dark transition-colors group-hover:scale-110 duration-200"
                  >
                    <Camera size={18} />
                  </label>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">
                  {t("profile_photo")}
                </p>
              </div>


              <div className="space-y-6">
                <FormField
                  label={t("full_name")}
                  icon={User}
                  placeholder="Your Name"
                  {...register("name")}
                  error={errors.name?.message}
                />

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2">
                    <Calendar size={14} className="text-primary" />
                    {t("birthday")}
                  </label>
                  <input
                    type="date"
                    {...register("birthday")}
                    className={cn(
                      "w-full h-14 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none transition-all",
                      errors.birthday && "bg-red-50 ring-2 ring-red-500/20"
                    )}
                  />
                  {errors.birthday && (
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">
                      {errors.birthday.message}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <FormField
                    label={t("set_password")}
                    icon={Lock}
                    type="password"
                    placeholder="••••••"
                    {...register("password")}
                    error={errors.password?.message}
                  />
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">
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
      </main>
    </div>
  );
}
