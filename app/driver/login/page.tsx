"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, LogIn, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppButton } from "@/components/ui/AppButton";
import { useLang } from "@/hooks/useLang";
import { FormField } from "@/components/FormField";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";


export default function DriverLogin() {
  const router = useRouter();
  const { t } = useLang();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/driver/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/dashboard");
      } else if (data.signupRequired) {
        // Carry phone to signup
        router.push(`/signup?phone=${phone}`);
      } else {
        setError(data.error || t("login_failed"));
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
            <LogIn className="text-emerald-500" /> {t("driver_portal")}
          </h1>
          <p className="text-slate-500 mt-2 flex items-center justify-center gap-1.5">
             {t("signin_desc")}
          </p>
        </div>

        <Card className="shadow-2xl shadow-slate-200/50 border-none rounded-3xl overflow-hidden">
          <div className="bg-emerald-500 h-2 w-full" />
          <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    {error}
                  </div>
                )}
                
                <FormField
                  label={t("phone_number")}
                  icon={Phone}
                  type="tel"
                  placeholder="01711 XXX XXX"
                  value={phone}
                  onChange={setPhone}
                  required
                />

                <AppButton
                  type="submit"
                  loading={loading}
                  fullWidth
                  className="mt-4 h-14 text-lg font-bold rounded-2xl shadow-emerald-200/50 shadow-xl"
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
           New driver? <AppButton 
            variant="ghost" 
            onClick={() => router.push("/signup")}
            className="text-emerald-600 h-10 px-2 font-bold inline-flex"
          >
            {t("signup_btn")}
          </AppButton>
        </div>
      </div>
    </div>
  );
}
