"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useLang } from "@/hooks/useLang";

export default function DriverRoot() {
  const router = useRouter();
  const { t } = useLang();

  useEffect(() => {
    const token = localStorage.getItem("cng_driver_token");
    if (token) {
      router.replace("/driver/dashboard");
    } else {
      router.replace("/driver/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-200/50">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs opacity-60 animate-pulse">
        {t("loading")}
      </p>
    </div>
  );
}
