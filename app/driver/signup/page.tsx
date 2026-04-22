"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2, Phone, User, FileText, Bike, ChevronRight, ChevronLeft, CheckCircle2, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppButton } from "@/components/ui/AppButton";
import { useLang } from "@/hooks/useLang";
import { FormField } from "@/components/FormField";
import { supabase } from "@/lib/supabase";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLang();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: searchParams.get("phone") || "",
    nidNumber: "",
    licenseNumber: "",
    vehicleNumber: "",
    vehicleType: "CNG", // Default
    photoUrl: ""
  });



  const handleChange = (field: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `driver-photos/${fileName}`;

      // Upload to Supabase Storage (Assumes 'drivers' bucket exists)
      const { error: uploadError } = await supabase.storage
        .from('drivers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('drivers')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, photoUrl: publicUrl }));
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("Upload error:", error);
      
      // Helpful hint for developers
      if (error.message?.includes("Bucket not found")) {
        console.warn("DEVELOPER HINT: You need to create a public bucket named 'drivers' in your Supabase dashboard.");
      }

      setError(t("upload_failed"));
      // Fallback for MVP if storage is not setup: just show success with a mock URL
      // This allows the user to continue signing up even if upload fails
      setFormData(prev => ({ ...prev, photoUrl: "https://via.placeholder.com/150" }));
    } finally {
      setUploading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && (!formData.name || !formData.phone)) {
      setError(t("error"));
      return;
    }
    setError("");
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/driver/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError(data.error || t("error"));
      }
    } catch {
      setError(t("network_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center border-t-4 border-emerald-500 relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center justify-center gap-2">
             {t("driver_signup")}
          </h1>
          <div className="flex items-center justify-center gap-3 mt-4">
             {[1, 2, 3].map(s => (
                <div 
                  key={s} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? "w-8 bg-emerald-500" : "w-4 bg-slate-200"}`} 
                />
             ))}
          </div>
        </div>

        <Card className="shadow-2xl shadow-slate-200/50 border-none rounded-3xl overflow-hidden">
          <div className="bg-emerald-500 h-2 w-full" />
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm border border-red-100 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  {error}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User size={16} /> {t("step_basic")}
                  </h3>
                  <FormField
                    label={t("full_name")}
                    icon={User}
                    placeholder="Karim Mia"
                    value={formData.name}
                    onChange={handleChange("name")}
                    required
                  />
                  <FormField
                    label={t("phone_number")}
                    icon={Phone}
                    type="tel"
                    placeholder="01711 XXX XXX"
                    value={formData.phone}
                    onChange={handleChange("phone")}
                    required
                  />
                  <AppButton type="button" onClick={nextStep} className="w-full h-14 text-lg font-bold rounded-2xl" rightIcon={<ChevronRight />}>
                    {t("next")}
                  </AppButton>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={16} /> {t("step_docs")}
                  </h3>
                  <FormField
                    label={t("nid_number")}
                    icon={FileText}
                    placeholder="1234567890"
                    value={formData.nidNumber}
                    onChange={handleChange("nidNumber")}
                  />
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t("upload_photo")}</label>
                    <div className="relative group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${formData.photoUrl ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-400 bg-slate-50'}`}
                      >
                        {uploading ? (
                          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                        ) : formData.photoUrl ? (
                          <div className="relative w-full h-full p-2 group/preview">
                             <Image 
                               src={formData.photoUrl} 
                               alt="Preview" 
                               width={128}
                               height={128}
                               className="w-full h-full object-cover rounded-xl shadow-inner border border-emerald-100"
                             />
                             <div className="absolute top-3 right-3 bg-emerald-500 text-white px-2 py-1 rounded-lg shadow-lg flex items-center gap-1.5 animate-in zoom-in-50 duration-300">
                               <CheckCircle2 size={14} />
                               <span className="text-[10px] font-black uppercase tracking-wider">{t("uploaded")}</span>
                             </div>
                             <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/preview:opacity-100 transition-all duration-300 flex flex-col items-center justify-center rounded-xl backdrop-blur-[2px]">
                               <Camera className="text-white w-6 h-6 mb-1" />
                               <span className="text-[10px] text-white font-bold uppercase tracking-widest">{t("change_photo")}</span>
                             </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Camera className="w-8 h-8 text-slate-400 group-hover:text-emerald-500" />
                            <span className="text-xs text-slate-500 font-medium">{t("upload_photo")}</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <AppButton type="button" variant="secondary" onClick={prevStep} className="h-14 rounded-2xl" leftIcon={<ChevronLeft />}>
                      {t("back")}
                    </AppButton>
                    <AppButton type="button" onClick={nextStep} className="h-14 rounded-2xl" rightIcon={<ChevronRight />}>
                      {t("next")}
                    </AppButton>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Bike size={16} /> {t("step_vehicle")}
                  </h3>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t("vehicle_type")}</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['CNG', 'Electric'].map(type => (
                        <AppButton
                          key={type}
                          type="button"
                          variant={formData.vehicleType === type ? 'primary' : 'secondary'}
                          onClick={() => setFormData(prev => ({ ...prev, vehicleType: type }))}
                          className={`h-14 rounded-2xl font-bold ${formData.vehicleType === type ? 'bg-slate-800' : ''}`}
                        >
                          {type === 'CNG' ? t("cng_gas") : t("cng_electric")}
                        </AppButton>
                      ))}
                    </div>
                  </div>

                  <FormField
                    label={t("vehicle_number")}
                    icon={Bike}
                    placeholder="Dhaka-Th-11-2222"
                    value={formData.vehicleNumber}
                    onChange={handleChange("vehicleNumber")}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <AppButton type="button" variant="secondary" onClick={prevStep} className="h-14 rounded-2xl" leftIcon={<ChevronLeft />}>
                      {t("back")}
                    </AppButton>
                    <AppButton type="submit" loading={loading || uploading} className="h-14 rounded-2xl" leftIcon={!loading && !uploading && <CheckCircle2 />}>
                      {t("submit")}
                    </AppButton>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DriverSignup() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>}>
      <SignupForm />
    </Suspense>
  );
}
