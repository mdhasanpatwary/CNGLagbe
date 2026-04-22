"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User, MapPin, Navigation, Banknote, ShieldCheck, Copyright } from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLang } from "@/hooks/useLang";

export default function LandingPage() {
  const router = useRouter();
  const { t } = useLang();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.ok ? res.json() : null)
      .then(data => data && setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.reload();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary text-primary-foreground p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight">{t("app_name")}</h1>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/history" className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/70 hover:text-white transition group flex items-center gap-1.5">
                <Navigation size={12} className="group-hover:animate-bounce" /> {t("booking_history")}
              </Link>
              <div className="h-4 w-[1px] bg-white/20" />
              <span className="text-[10px] font-black bg-white/10 px-3 py-1.5 rounded-full uppercase tracking-widest">
                {user.role === "DRIVER" ? t("driver_portal") : t("welcome_user")}: {user.name}
              </span>
              <AppButton variant="ghost" onClick={handleLogout} className="rounded-full hover:bg-white/10 h-12 p-2">
                <LogOut size={16} />
              </AppButton>
            </div>
          ) : (

            <div className="flex gap-2">
              <Link href="/login">
                <AppButton variant="ghost" className="rounded-full text-white hover:bg-white/10 font-bold text-xs uppercase">
                  {t("user_login")}
                </AppButton>
              </Link>
              <Link href="/driver/login">
                <AppButton variant="secondary" className="rounded-full font-bold text-xs uppercase" leftIcon={<User className="w-3 h-3" />}>
                  {t("driver_login")}
                </AppButton>
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full mt-8">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="bg-primary/20 p-6 rounded-full">
            <Navigation className="w-16 h-16 text-primary" />
          </div>
          <span className="text-xs font-bold text-primary tracking-widest uppercase flex items-center gap-1">
            <Navigation size={12} /> {t("explore")}
          </span>
        </div>
        
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">{t("need_cng")}</h2>
        <p className="text-slate-500 mb-8 max-w-[280px]">
          {t("cng_desc")}
        </p>

        <AppButton 
          onClick={() => {
            if (user?.role === "DRIVER") {
              router.push("/dashboard");
            } else {
              router.push("/user/map");
            }
          }}
          className="w-full text-lg mb-10 h-14 rounded-xl shadow-lg font-bold"
          leftIcon={<MapPin className="w-5 h-5" />}
        >
          {user?.role === "DRIVER" ? t("driver_portal") : t("set_pickup")}
        </AppButton>

        {/* Feature Highlights */}
        <div className="grid gap-4 w-full">
          <Card className="border-slate-100 shadow-sm">
            <CardContent className="flex items-center gap-4 text-left p-4">
              <div className="bg-slate-100 p-3 rounded-full text-slate-700">
                <Banknote className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                  {t("fixed_fare")}
                </h3>
                <p className="text-xs text-slate-500">{t("fare_desc")}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-slate-100 shadow-sm">
            <CardContent className="flex items-center gap-4 text-left p-4">
              <div className="bg-slate-100 p-3 rounded-full text-slate-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                  {t("reliable_drivers")}
                </h3>
                <p className="text-xs text-slate-500">{t("drivers_desc")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="text-center p-6 text-slate-400 text-xs flex flex-col items-center gap-2">
        <p className="flex items-center gap-1">
          <Copyright size={10} /> {t("app_name")} {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
