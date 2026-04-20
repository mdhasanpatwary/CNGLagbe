"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, Lock, LogIn, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/useLang";
import { FormField } from "@/components/FormField";


export default function DriverLogin() {
  const router = useRouter();
  const { t } = useLang();
  const [phone, setPhone] = useState("01711111111"); // Seeded default for ease of testing
  const [password, setPassword] = useState("driver123");
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
        body: JSON.stringify({ phone, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("cng_driver_token", data.token);
        router.push("/driver/dashboard");
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center border-t-4 border-emerald-500">
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
                
                <FormField
                  label={t("password")}
                  icon={Lock}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={setPassword}
                  required
                />


                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 h-14 text-lg font-bold rounded-2xl shadow-emerald-200/50 shadow-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all"
                  size="lg"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogIn className="w-5 h-5" />
                      {t("login_btn")}
                    </div>
                  )}
                </Button>
              </form>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/driver/signup")}
            className="text-slate-500 font-bold hover:text-emerald-600 transition-colors gap-2"
          >
            {t("driver_signup")} <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
