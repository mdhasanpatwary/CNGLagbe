"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { AppButton } from "@/components/ui/AppButton";
import { useLang } from "@/hooks/useLang";
import { FormField } from "@/components/FormField";
import { Header } from "@/components/layout/Header";
import { PageHeading } from "@/components/ui/PageHeading";
import { driverLoginSchema, type DriverLoginInput } from "@/lib/schemas/auth";


export default function DriverLogin() {
  const router = useRouter();
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DriverLoginInput>({
    resolver: zodResolver(driverLoginSchema),
    defaultValues: {
      phone: "",
    },
  });

  const onSubmit = async (data: DriverLoginInput) => {
    setLoading(true);
    setServerError("");

    try {
      const res = await fetch("/api/auth/driver/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const resData = await res.json();

      if (res.ok) {
        router.push("/driver/dashboard");
      } else if (resData.signupRequired) {
        // Carry phone to signup
        router.push(`/driver/signup?phone=${data.phone}`);
      } else {
        setServerError(resData.error || t("login_failed"));
      }
    } catch {
      setServerError(t("network_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen premium-bg-surface flex flex-col relative overflow-hidden">
      {/* Texture Overlay */}
      <div className="absolute inset-0 dot-grid-texture opacity-50 pointer-events-none" />
      
      <Header role="driver" />
      <div className="flex-1 flex flex-col justify-center relative z-10">
      <div className="max-w-md w-full mx-auto p-6">
        <PageHeading 
          title={t("driver_portal") as string} 
          subtitle={t("signin_desc") as string}
          centered
          className="mb-8"
        />

        <Card className="shadow-2xl shadow-slate-200/50 border-none rounded-3xl overflow-hidden">
          <div className="bg-primary h-2 w-full" />
          <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {serverError && (
                  <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    {serverError}
                  </div>
                )}
                
                <FormField
                  label={t("phone_number")}
                  icon={Phone}
                  type="tel"
                  placeholder="01711 XXX XXX"
                  {...register("phone")}
                  error={errors.phone?.message}
                />

                <AppButton
                  type="submit"
                  loading={loading}
                  fullWidth
                  className="mt-4 h-14 text-lg font-bold rounded-2xl shadow-primary/20 shadow-xl"
                >
                  <div className="flex items-center gap-2">
                     {t("login_btn")}
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </AppButton>
              </form>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center text-slate-400 text-sm">
           {t("new_driver_question")} <AppButton 
            variant="ghost" 
            onClick={() => router.push("/driver/signup")}
            className="text-primary h-10 px-2 font-bold inline-flex"
          >
            {t("signup_btn")}
          </AppButton>
        </div>
        </div>
      </div>
    </div>
  );
}
