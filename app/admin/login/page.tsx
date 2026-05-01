"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Lock, LogIn, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { AppButton } from "@/components/ui/AppButton";
import { useLang } from "@/hooks/useLang";
import { FormField } from "@/components/FormField";
import { adminLoginSchema, type AdminLoginInput } from "@/lib/schemas/auth";

export default function AdminLogin() {
  const router = useRouter();
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const onSubmit = async (data: AdminLoginInput) => {
    setLoading(true);
    setServerError("");

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const resData = await res.json();

      if (res.ok) {
        router.push("/admin");
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center border-t-4 border-emerald-500">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center mb-8">
          <div className="inline-flex bg-emerald-500/10 p-3 rounded-2xl mb-4 border border-emerald-500/20">
            <Shield className="text-emerald-600 w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center justify-center gap-2 tracking-tight">
            {t("admin_login")}
          </h1>
          <p className="text-slate-500 mt-2 text-xs font-black uppercase tracking-wider">
             {t("signin_desc")}
          </p>
        </div>

        <Card className="shadow-2xl shadow-slate-200/50 border-none rounded-[2rem] overflow-hidden bg-white border border-slate-100">
          <div className="bg-emerald-500 h-2 w-full" />
          <CardContent className="p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {serverError && (
                  <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
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
                
                <FormField
                  label={t("password")}
                  icon={Lock}
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  error={errors.password?.message}
                />

                <AppButton
                  type="submit"
                  loading={loading}
                  fullWidth
                  className="mt-4 h-14 text-base font-black uppercase tracking-widest rounded-2xl bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 text-white"
                  leftIcon={<LogIn className="w-5 h-5" />}
                >
                  {t("login_btn")}
                </AppButton>
              </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
