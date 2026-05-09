"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2, Phone, User, FileText, Bike, ChevronRight, ChevronLeft, CheckCircle2, Camera, MapPin } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { AppButton } from "@/components/ui/AppButton";
import { useLang } from "@/hooks/useLang";
import { FormField } from "@/components/FormField";
import { supabase } from "@/lib/supabase";
import { Header } from "@/components/layout/Header";
import { type TextKey } from "@/constants/text";
import { driverSignupSchema, type DriverSignupInput } from "@/lib/schemas/auth";
import { SearchableSelect } from "@/components/SearchableSelect";
import { PageHeading } from "@/components/ui/PageHeading";
import { Controller } from "react-hook-form";

interface DocUploadFieldProps {
  field: keyof DriverSignupInput;
  label: string;
  description?: string;
  icon: React.ElementType;
  value: string;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, field: keyof DriverSignupInput) => void;
  error?: string;
  t: (key: TextKey) => string;
  required?: boolean;
}

const DocUploadField = ({ field, label, description, icon: Icon, value, uploading, onUpload, error, t, required }: DocUploadFieldProps) => (
  <div className="space-y-2">
    <div className="flex justify-between items-end ml-1">
      <div className="flex flex-col">
        <label className="text-xs font-black tracking-widest text-slate-400 uppercase">
          {label}
          {required && <span className="text-red-500 ml-0.5 font-black">*</span>}
        </label>
        {description && <p className="text-[10px] text-slate-400 font-medium leading-tight">{description}</p>}
      </div>
      {error && <span className="text-[10px] font-bold text-red-500">{error}</span>}
    </div>
    <div className="relative group">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onUpload(e, field)}
        className="hidden"
        id={`upload-${field}`}
      />
      <label
        htmlFor={`upload-${field}`}
        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden ${value ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50 bg-slate-50'}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-[10px] font-bold text-primary animate-pulse">{t("loading")}</span>
          </div>
        ) : value ? (
          <div className="relative w-full h-full group/preview">
             <Image 
               src={value} 
               alt="Preview" 
               fill
               className="object-cover transition-all duration-500 group-hover/preview:scale-110 group-hover/preview:object-top"
             />
             <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded-lg shadow-lg flex items-center gap-1.5 z-10 animate-in zoom-in-50 duration-300">
               <CheckCircle2 size={12} />
               <span className="text-[10px] font-black tracking-wider">{t("uploaded")}</span>
             </div>
               <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/preview:opacity-100 transition-all duration-300 flex flex-col items-center justify-center backdrop-blur-[2px]">
                 <Icon className="text-white w-6 h-6 mb-1" />
                 <span className="text-[10px] text-white font-black tracking-widest">{t("change_photo")}</span>
               </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Icon className="w-5 h-5 text-slate-400 group-hover:text-primary" />
            </div>
            <span className="text-xs text-slate-500 font-bold tracking-tight">{label}</span>
          </div>
        )}
      </label>
    </div>
  </div>
);

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLang();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [serverError, setServerError] = useState("");
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
    trigger,
    setValue,
    control,
    formState: { errors },
  } = useForm<DriverSignupInput>({
    resolver: zodResolver(driverSignupSchema),
    defaultValues: {
      name: "",
      phone: searchParams.get("phone") || "",
      address: "",
      nearbyBazar: "",
      nidNumber: "",
      licenseNumber: "",
      vehicleNumber: "",
      vehicleType: "CNG",
      photoUrl: "",
      nidFrontUrl: "",
      nidBackUrl: "",
      licenseFrontUrl: "",
      licenseBackUrl: "",
    },
  });

  const photoUrl = useWatch({ control, name: "photoUrl" });
  const nidFrontUrl = useWatch({ control, name: "nidFrontUrl" });
  const nidBackUrl = useWatch({ control, name: "nidBackUrl" });
  const licenseFrontUrl = useWatch({ control, name: "licenseFrontUrl" });
  const licenseBackUrl = useWatch({ control, name: "licenseBackUrl" });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof DriverSignupInput) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setServerError("");

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `driver-docs/${field}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('drivers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('drivers')
        .getPublicUrl(filePath);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue(field, publicUrl as any);
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("Upload error:", error);
      setServerError(t("upload_failed"));
    } finally {
      setUploading(false);
    }
  };

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(["name", "phone", "address", "nearbyBazar"]);
    } else if (step === 2) {
      isValid = await trigger(["photoUrl", "nidNumber", "nidFrontUrl", "nidBackUrl"]);
    } else if (step === 3) {
      isValid = await trigger(["vehicleNumber"]);
    }

    if (isValid) {
      setServerError("");
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => setStep(prev => prev - 1);

  const onSubmit = async (data: DriverSignupInput) => {
    setLoading(true);
    setServerError("");

    try {
      const res = await fetch("/api/auth/driver/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const resData = await res.json();

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setServerError(resData.error || t("error"));
      }
    } catch {
      setServerError(t("network_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header role="driver" />
      <div className="flex-1 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center mb-8">
          <PageHeading 
            title={t("driver_signup")} 
            subtitle={t("signup_desc")} 
            centered
          />
          <div className="flex items-center justify-center gap-3 mt-4">
             {[1, 2, 3, 4].map(s => (
                <div 
                  key={s} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? "w-8 bg-primary" : "w-4 bg-slate-200"}`} 
                />
             ))}
          </div>
        </div>

        <Card className="shadow-2xl shadow-slate-200/50 border-none rounded-3xl overflow-visible">
          <div className="bg-primary h-2 w-full rounded-t-3xl" />
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {serverError && (
                <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm border border-red-100 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  {serverError}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <h3 className="text-sm font-black text-slate-400 tracking-widest flex items-center gap-2">
                    <User size={16} /> {t("step_basic")}
                  </h3>
                  <FormField
                    label={t("full_name")}
                    icon={User}
                    placeholder="Karim Mia"
                    {...register("name")}
                    error={errors.name?.message}
                  />
                  <FormField
                    label={t("phone_number")}
                    icon={Phone}
                    type="tel"
                    placeholder="01711 XXX XXX"
                    {...register("phone")}
                    error={errors.phone?.message}
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
                  <AppButton type="button" onClick={nextStep} className="w-full h-14 text-lg font-bold rounded-2xl" rightIcon={<ChevronRight />}>
                    {t("next")}
                  </AppButton>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <h3 className="text-sm font-black text-slate-400 tracking-widest flex items-center gap-2">
                    <User size={16} /> {t("step_docs_nid")}
                  </h3>
                  
                  <DocUploadField 
                    field="photoUrl"
                    label={t("upload_photo")}
                    description={t("photo_desc")}
                    icon={Camera}
                    value={photoUrl || ""}
                    uploading={uploading}
                    onUpload={handleFileUpload}
                    error={errors.photoUrl?.message}
                    t={t}
                  />

                  <FormField
                    label={t("nid_number")}
                    icon={FileText}
                    placeholder="1234567890"
                    {...register("nidNumber")}
                    error={errors.nidNumber?.message}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <DocUploadField 
                      field="nidFrontUrl"
                      label={t("nid_front")}
                      icon={FileText}
                      value={nidFrontUrl || ""}
                      uploading={uploading}
                      onUpload={handleFileUpload}
                      error={errors.nidFrontUrl?.message}
                      t={t}
                    />
                    <DocUploadField 
                      field="nidBackUrl"
                      label={t("nid_back")}
                      icon={FileText}
                      value={nidBackUrl || ""}
                      uploading={uploading}
                      onUpload={handleFileUpload}
                      error={errors.nidBackUrl?.message}
                      t={t}
                    />
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
                  <h3 className="text-sm font-black text-slate-400 tracking-widest flex items-center gap-2">
                    <Bike size={16} /> {t("step_docs_vehicle")}
                  </h3>

                  {/* Read-only Vehicle Type Indicator */}
                  <div className="bg-slate-50 p-4 rounded-3xl border-2 border-slate-100 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                        <Bike className="text-primary w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 tracking-widest leading-none mb-1">{t("vehicle_type")}</p>
                        <p className="text-xl font-black text-slate-800 leading-none">CNG</p>
                      </div>
                    </div>
                    <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider">
                      {t("fixed_fare")}
                    </div>
                  </div>

                  <FormField
                    label={t("vehicle_number")}
                    icon={Bike}
                    placeholder="Dhaka-Th-11-2222"
                    {...register("vehicleNumber")}
                    error={errors.vehicleNumber?.message}
                  />



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

              {step === 4 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <h3 className="text-sm font-black text-slate-400 tracking-widest flex items-center gap-2">
                    <FileText size={16} /> {t("step_docs_license")}
                  </h3>

                  <FormField
                    label={t("license_number")}
                    icon={FileText}
                    placeholder="DK-1234567"
                    {...register("licenseNumber")}
                    error={errors.licenseNumber?.message}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <DocUploadField 
                      field="licenseFrontUrl"
                      label={t("license_front")}
                      icon={Camera}
                      value={licenseFrontUrl || ""}
                      uploading={uploading}
                      onUpload={handleFileUpload}
                      error={errors.licenseFrontUrl?.message}
                      t={t}
                    />
                    <DocUploadField 
                      field="licenseBackUrl"
                      label={t("license_back")}
                      icon={Camera}
                      value={licenseBackUrl || ""}
                      uploading={uploading}
                      onUpload={handleFileUpload}
                      error={errors.licenseBackUrl?.message}
                      t={t}
                    />
                  </div>

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
        
        <div className="mt-8 text-center text-slate-400 text-sm">
           {t("login_here_question")} <AppButton 
            variant="ghost" 
            onClick={() => router.push("/driver/login")}
            className="text-primary h-10 px-2 font-bold inline-flex"
          >
            {t("login_btn")}
          </AppButton>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function DriverSignup() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <SignupForm />
    </Suspense>
  );
}
