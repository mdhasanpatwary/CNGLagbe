"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Key, LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { AppButton } from "@/components/ui/AppButton";
import { useLang } from "@/hooks/useLang";
import { FormField } from "@/components/FormField";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";

export default function UserLogin() {
  const router = useRouter();
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      otp: "1234",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setServerError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const resData = await res.json();

      if (res.ok) {
        if (resData.user.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/user/map");
        }
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center border-t-4 border-primary">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center justify-center gap-2">
            <LogIn className="text-primary" /> {t("user_login")}
          </h1>
          <p className="text-slate-500 mt-2">
             {t("signin_desc")}
          </p>
        </div>

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
                
                <FormField
                  label={t("otp_label")}
                  icon={Key}
                  type="number"
                  placeholder="1234"
                  {...register("otp")}
                  error={errors.otp?.message}
                />

                <AppButton
                  type="submit"
                  loading={loading}
                  fullWidth
                  className="mt-4 h-14 text-lg font-bold rounded-2xl shadow-primary/20 shadow-xl"
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
