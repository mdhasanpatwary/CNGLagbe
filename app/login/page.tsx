"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

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
    },
  });

  const onNextStep = async () => {
    // Validate only phone field before moving to step 2
    const isPhoneValid = await trigger("phone");
    if (isPhoneValid) {
      setStep(2);
      setServerError("");
    }
  };

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
        router.push("/user/map");
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        <PageHeading 
          title={t("user_login") as string} 
          subtitle={step === 1 ? t("signin_desc") as string : "Enter the OTP sent to your phone"}
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
                      fullWidth
                      className="mt-4 h-14 text-lg font-bold rounded-2xl shadow-primary/20 shadow-xl"
                      rightIcon={<ArrowRight className="w-5 h-5" />}
                    >
                      Send OTP
                    </AppButton>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="text-sm font-medium text-slate-500 mb-4 text-center">
                      OTP sent to {getValues("phone")}
                    </div>
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
