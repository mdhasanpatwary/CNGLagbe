"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, Lock, User, FileText, Bike, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/useLang";
import { FormField } from "@/components/FormField";

export default function DriverSignup() {
  const router = useRouter();
  const { t } = useLang();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    nidNumber: "",
    licenseNumber: "",
    vehicleNumber: ""
  });

  const handleChange = (field: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (step === 1 && (!formData.name || !formData.phone || !formData.password)) {
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
        localStorage.setItem("cng_driver_token", data.token);
        router.push("/driver/dashboard");
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center border-t-4 border-emerald-500">
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
                  <FormField
                    label={t("password")}
                    icon={Lock}
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange("password")}
                    required
                  />
                  <Button type="button" onClick={nextStep} className="w-full h-14 text-lg font-bold rounded-2xl bg-emerald-500 hover:bg-emerald-600">
                    {t("next")} <ChevronRight className="ml-2" />
                  </Button>
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
                  <FormField
                    label={t("license_number")}
                    icon={FileText}
                    placeholder="DL-12345"
                    value={formData.licenseNumber}
                    onChange={handleChange("licenseNumber")}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Button type="button" variant="outline" onClick={prevStep} className="h-14 rounded-2xl">
                      <ChevronLeft className="mr-2" /> {t("back")}
                    </Button>
                    <Button type="button" onClick={nextStep} className="h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600">
                      {t("next")} <ChevronRight className="ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Bike size={16} /> {t("step_vehicle")}
                  </h3>
                  <FormField
                    label={t("vehicle_number")}
                    icon={Bike}
                    placeholder="Dhaka-Th-11-2222"
                    value={formData.vehicleNumber}
                    onChange={handleChange("vehicleNumber")}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Button type="button" variant="outline" onClick={prevStep} className="h-14 rounded-2xl">
                      <ChevronLeft className="mr-2" /> {t("back")}
                    </Button>
                    <Button type="submit" disabled={loading} className="h-14 rounded-2xl bg-emerald-500">
                      {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 className="mr-2" /> {t("submit")}</>}
                    </Button>
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
