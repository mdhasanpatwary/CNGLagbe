"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Phone, Key, LogIn, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { AppButton } from "@/components/ui/AppButton";
import { useLang } from "@/hooks/useLang";
import { FormField } from "@/components/FormField";
import { Header } from "@/components/layout/Header";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { PageHeading } from "@/components/ui/PageHeading";

export default function UserLogin() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [serverError, setServerError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [isNewUser, setIsNewUser] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      otp: "1234",
      password: "",
      newPassword: "",
    },
  });

  const onNextStep = async () => {
    const isPhoneValid = await trigger("phone");
    if (!isPhoneValid) return;

    setChecking(true);
    setServerError("");

    try {
      const res = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: getValues("phone") }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsNewUser(!data.hasPassword);
        setStep(2);
      } else {
        setServerError(data.error || "Failed to check phone number");
      }
    } catch {
      setServerError(t("network_error"));
    } finally {
      setChecking(false);
    }
  };

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setServerError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await res.json();

      if (res.ok) {
        router.push(redirect);
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
      
      <Header theme="light" />
      <div className="flex-1 flex flex-col justify-center relative z-10">
        <div className="max-w-md w-full mx-auto p-6">
          <PageHeading
            title={t("user_login") as string}
            subtitle={
              step === 1
                ? (t("signin_desc") as string)
                : isNewUser
                ? "First time login? Verify OTP and set a password."
                : "Welcome back! Enter your password to login."
            }
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

                {step === 1 && (
                  <>
                    <FormField
                      label={t("phone_number")}
                      icon={Phone}
                      type="tel"
                      placeholder="01711 XXX XXX"
                      {...register("phone")}
                      error={errors.phone?.message}
                    />

                    <AppButton
                      type="button"
                      onClick={onNextStep}
                      loading={checking}
                      fullWidth
                      className="mt-4 h-14 text-lg font-bold rounded-2xl shadow-primary/20 shadow-xl"
                      rightIcon={<ArrowRight className="w-5 h-5" />}
                    >
                      {t("continue") || "Continue"}
                    </AppButton>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="text-sm font-medium text-slate-500 mb-4 text-center">
                      Phone: {getValues("phone")}
                    </div>

                    {isNewUser ? (
                      <>
                        <FormField
                          label={t("otp_label")}
                          icon={Key}
                          type="number"
                          placeholder="1234"
                          {...register("otp")}
                          error={errors.otp?.message}
                        />
                        <FormField
                          label="Set New Password"
                          icon={LogIn}
                          type="password"
                          placeholder="••••••••"
                          {...register("newPassword")}
                          error={errors.newPassword?.message}
                        />
                      </>
                    ) : (
                      <FormField
                        label={t("password")}
                        icon={LogIn}
                        type="password"
                        placeholder="••••••••"
                        {...register("password")}
                        error={errors.password?.message}
                      />
                    )}

                    <AppButton
                      type="submit"
                      loading={loading}
                      fullWidth
                      className="mt-4 h-14 text-lg font-bold rounded-2xl shadow-primary/20 shadow-xl"
                      leftIcon={<LogIn className="w-5 h-5" />}
                    >
                      {t("login_btn")}
                    </AppButton>

                    <div className="text-center mt-4">
                      <AppButton
                        type="button"
                        variant="ghost"
                        onClick={() => setStep(1)}
                        className="text-sm text-slate-500 hover:text-primary font-medium transition-colors h-auto p-0 hover:bg-transparent"
                      >
                        Change Phone Number
                      </AppButton>
                    </div>
                  </>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

