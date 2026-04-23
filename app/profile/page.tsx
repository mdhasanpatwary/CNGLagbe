"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, Camera, Calendar, Save, ChevronLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppButton } from "@/components/ui/AppButton";
import { useLang } from "@/hooks/useLang";
import { FormField } from "@/components/FormField";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/utils/api";

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useLang();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    photoUrl: "",
    birthday: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiFetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          const user = data.user;
          setFormData({
            name: user.name || "",
            photoUrl: user.photoUrl || "",
            birthday: user.birthday ? new Date(user.birthday).toISOString().split("T")[0] : "",
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
  }, [router]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

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

      setFormData(prev => ({ ...prev, photoUrl: publicUrl }));
    } catch (err: unknown) {
      console.error("Upload error:", err);
      setError(t("upload_failed") as string);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await apiFetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <header className="w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <AppButton 
            variant="ghost" 
            onClick={() => router.back()} 
            className="rounded-full w-10 h-10 p-0"
          >
            <ChevronLeft size={20} />
          </AppButton>
          <h1 className="text-lg font-black text-slate-800 uppercase tracking-tight">
            {t("profile")}
          </h1>
        </div>
        <LanguageSwitcher />
      </header>

      <main className="p-6 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden">
          <div className="bg-emerald-500 h-2 w-full" />
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Photo Section */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 overflow-hidden border-4 border-white shadow-xl relative">
                    {formData.photoUrl ? (
                      <Image 
                        src={formData.photoUrl} 
                        alt="Profile" 
                        fill 
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <User size={48} />
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
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
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 text-white rounded-xl shadow-lg flex items-center justify-center cursor-pointer hover:bg-emerald-600 transition-colors group-hover:scale-110 duration-200"
                  >
                    <Camera size={18} />
                  </label>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">
                  {t("profile_photo")}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm border border-red-100 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-sm border border-emerald-100 flex items-center gap-3 animate-in zoom-in-95">
                  <CheckCircle2 size={18} />
                  {t("update_success")}
                </div>
              )}

              <div className="space-y-6">
                <FormField
                  label={t("full_name")}
                  icon={User}
                  placeholder="Your Name"
                  value={formData.name}
                  onValueChange={(val) => setFormData(p => ({ ...p, name: val }))}
                  required
                />

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2">
                    <Calendar size={14} className="text-emerald-500" />
                    {t("birthday")}
                  </label>
                  <input
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData(p => ({ ...p, birthday: e.target.value }))}
                    className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <AppButton 
                type="submit" 
                loading={saving} 
                className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600 text-white"
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
