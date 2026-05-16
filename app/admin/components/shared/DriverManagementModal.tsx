"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2, User, FileText, Bike, ChevronRight, ChevronLeft, CheckCircle2, Camera, MapPin, X } from "lucide-react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppButton } from "@/components/ui/AppButton";
import { useLang } from "@/hooks/useLang";
import { FormField } from "@/components/FormField";
import { supabase } from "@/lib/supabase";
import { driverSignupSchema, type DriverSignupInput } from "@/lib/schemas/auth";
import { SearchableSelect } from "@/components/SearchableSelect";
import { type PendingDriver } from "@/lib/types/admin";
import { type TextKey } from "@/constants/text";

interface DriverManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver?: PendingDriver | null;
  onSuccess: () => void;
  bazars: string[];
}

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
        <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
          {label}
          {required && <span className="text-red-500 ml-0.5 font-black">*</span>}
        </label>
        {description && <p className="text-[9px] text-slate-400 font-medium leading-tight">{description}</p>}
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
        className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden ${value ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50 bg-slate-50'}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="text-[9px] font-bold text-primary animate-pulse">{t("loading")}</span>
          </div>
        ) : value && value !== "N/A" && (value.startsWith('http') || value.startsWith('/')) ? (
          <div className="relative w-full h-full group/preview">
             <Image 
               src={value} 
               alt="Preview" 
               fill
               className="object-cover transition-all duration-500 group-hover/preview:scale-110 group-hover/preview:object-top"
             />
             <div className="absolute top-2 right-2 bg-primary text-white px-2 py-0.5 rounded-lg shadow-lg flex items-center gap-1 z-10 animate-in zoom-in-50 duration-300">
               <CheckCircle2 size={10} />
               <span className="text-[8px] font-black tracking-wider">{t("uploaded")}</span>
             </div>
               <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/preview:opacity-100 transition-all duration-300 flex flex-col items-center justify-center backdrop-blur-[2px]">
                 <Icon className="text-white w-5 h-5 mb-1" />
                 <span className="text-[8px] text-white font-black tracking-widest">{t("change_photo")}</span>
               </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 px-4 text-center">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Icon className="w-4 h-4 text-slate-400 group-hover:text-primary" />
            </div>
            <span className="text-[10px] text-slate-500 font-bold tracking-tight">{label}</span>
          </div>
        )}
      </label>
    </div>
  </div>
);

export function DriverManagementModal({ isOpen, onClose, driver, onSuccess, bazars }: DriverManagementModalProps) {
  const { t } = useLang();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<DriverSignupInput>({
    resolver: zodResolver(driverSignupSchema),
    defaultValues: {
      name: "",
      phone: "",
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

  useEffect(() => {
    if (driver) {
      reset({
        name: driver.name,
        phone: driver.phone,
        address: driver.address || "",
        nearbyBazar: driver.nearbyBazar || "",
        nidNumber: driver.nidNumber || "",
        licenseNumber: driver.licenseNumber || "",
        vehicleNumber: driver.vehicleNumber || "",
        vehicleType: "CNG",
        photoUrl: driver.photoUrl || "",
        nidFrontUrl: driver.nidFrontUrl || "",
        nidBackUrl: driver.nidBackUrl || "",
        licenseFrontUrl: driver.licenseFrontUrl || "",
        licenseBackUrl: driver.licenseBackUrl || "",
      });
    } else {
      reset({
        name: "",
        phone: "",
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
      });
    }
    Promise.resolve().then(() => {
      setStep(1);
      setServerError("");
    });
  }, [driver, reset, isOpen]);

  const photoUrl = useWatch({ control, name: "photoUrl" });
  const nidFrontUrl = useWatch({ control, name: "nidFrontUrl" });
  const nidBackUrl = useWatch({ control, name: "nidBackUrl" });
  const licenseFrontUrl = useWatch({ control, name: "licenseFrontUrl" });
  const licenseBackUrl = useWatch({ control, name: "licenseBackUrl" });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof DriverSignupInput) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
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

      setValue(field, publicUrl);
    } catch (err: unknown) {
      console.error("Upload error:", err);
      setServerError(t("upload_failed"));
    } finally {
      setUploadingField(null);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof DriverSignupInput)[] = [];
    if (step === 1) fieldsToValidate = ["name", "phone", "address", "nearbyBazar"];
    if (step === 2) fieldsToValidate = ["photoUrl", "nidNumber", "nidFrontUrl", "nidBackUrl"];
    if (step === 3) fieldsToValidate = ["vehicleNumber"];
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => setStep(prev => prev - 1);

  const onSubmit = async (data: DriverSignupInput) => {
    setLoading(true);
    setServerError("");

    try {
      const url = driver ? `/api/admin/drivers/${driver.id}` : "/api/admin/drivers";
      const method = driver ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const resData = await res.json();
        setServerError(resData.error || t("error"));
      }
    } catch {
      setServerError(t("network_error"));
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
              {driver ? t("edit_driver") : t("add_driver")}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3, 4].map(s => (
                <div 
                  key={s} 
                  className={`h-1 rounded-full transition-all duration-500 ${step >= s ? "w-6 bg-primary" : "w-3 bg-slate-200"}`} 
                />
              ))}
            </div>
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
                {serverError}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <h4 className="text-[10px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                  <User size={14} /> {t("basic_info")}
                </h4>
                <FormField
                  label={t("full_name")}
                  icon={User}
                  placeholder="Karim Mia"
                  {...register("name")}
                  error={errors.name?.message}
                />
                <FormField
                  label={t("phone_number")}
                  icon={MapPin}
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
                <AppButton type="button" onClick={nextStep} className="w-full h-14 font-bold rounded-2xl" rightIcon={<ChevronRight size={18} />}>
                  {t("next")}
                </AppButton>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <h4 className="text-[10px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                  <FileText size={14} /> {t("nid_info")}
                </h4>
                
                <DocUploadField 
                  field="photoUrl"
                  label={t("upload_photo")}
                  icon={Camera}
                  value={photoUrl || ""}
                  uploading={uploadingField === "photoUrl"}
                  onUpload={handleFileUpload}
                  error={errors.photoUrl?.message}
                  t={t}
                  required
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
                    uploading={uploadingField === "nidFrontUrl"}
                    onUpload={handleFileUpload}
                    error={errors.nidFrontUrl?.message}
                    t={t}
                    required
                  />
                  <DocUploadField 
                    field="nidBackUrl"
                    label={t("nid_back")}
                    icon={FileText}
                    value={nidBackUrl || ""}
                    uploading={uploadingField === "nidBackUrl"}
                    onUpload={handleFileUpload}
                    error={errors.nidBackUrl?.message}
                    t={t}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <AppButton type="button" variant="secondary" onClick={prevStep} className="h-14 rounded-2xl" leftIcon={<ChevronLeft size={18} />}>
                    {t("back")}
                  </AppButton>
                  <AppButton type="button" onClick={nextStep} className="h-14 rounded-2xl" rightIcon={<ChevronRight size={18} />}>
                    {t("next")}
                  </AppButton>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <h4 className="text-[10px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                  <Bike size={14} /> {t("vehicle_info")}
                </h4>

                <div className="bg-slate-50 p-4 rounded-3xl border-2 border-slate-100 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                      <Bike className="text-primary w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 tracking-widest leading-none mb-1 uppercase">{t("vehicle_type")}</p>
                      <p className="text-lg font-black text-slate-800 leading-none">CNG</p>
                    </div>
                  </div>
                </div>

                <FormField
                  label={t("vehicle_number")}
                  icon={Bike}
                  placeholder="Dhaka-Th-11-2222"
                  {...register("vehicleNumber")}
                  error={errors.vehicleNumber?.message}
                />

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <AppButton type="button" variant="secondary" onClick={prevStep} className="h-14 rounded-2xl" leftIcon={<ChevronLeft size={18} />}>
                    {t("back")}
                  </AppButton>
                  <AppButton type="button" onClick={nextStep} className="h-14 rounded-2xl" rightIcon={<ChevronRight size={18} />}>
                    {t("next")}
                  </AppButton>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <h4 className="text-[10px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                  <FileText size={14} /> {t("license_info")}
                </h4>

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
                    uploading={uploadingField === "licenseFrontUrl"}
                    onUpload={handleFileUpload}
                    error={errors.licenseFrontUrl?.message}
                    t={t}
                    required
                  />
                  <DocUploadField 
                    field="licenseBackUrl"
                    label={t("license_back")}
                    icon={Camera}
                    value={licenseBackUrl || ""}
                    uploading={uploadingField === "licenseBackUrl"}
                    onUpload={handleFileUpload}
                    error={errors.licenseBackUrl?.message}
                    t={t}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <AppButton type="button" variant="secondary" onClick={prevStep} className="h-14 rounded-2xl" leftIcon={<ChevronLeft size={18} />}>
                    {t("back")}
                  </AppButton>
                  <AppButton 
                    type="submit" 
                    loading={loading}
                    disabled={loading}
                    className="flex-1 h-14 bg-primary hover:bg-primary-dark text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
                    leftIcon={step === 4 ? <CheckCircle2 className="w-5 h-5" /> : false}
                  >
                    {step === 4 ? (driver ? t("save_changes") : t("submit")) : t("next")}
                  </AppButton>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
