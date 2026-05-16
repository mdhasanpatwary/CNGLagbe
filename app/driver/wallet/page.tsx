"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/hooks/useLang";
import { Header } from "@/components/layout/Header";
import { PageHeading } from "@/components/ui/PageHeading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppButton } from "@/components/ui/AppButton";
import { 
  Wallet, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Banknote,
  Clock,
  Navigation,
  Info
} from "lucide-react";
import { User as UserType } from "@/lib/types/user";
import { WalletSkeleton } from "@/components/ui/AppSkeletons";
import { apiFetch } from "@/utils/api";
import { formatDecimal } from "@/lib/utils";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  details: string;
  createdAt: string;
  booking?: {
    pickupAddress: string;
    destAddress: string;
  };
}

interface DriverInfo {
  id: string;
  name: string;
  photoUrl: string;
}

interface WalletData {
  balance: number;
  transactions: Transaction[];
  driver: DriverInfo;
}

export default function DriverWalletPage() {
  const router = useRouter();
  const { t } = useLang();
  const [data, setData] = useState<WalletData | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await apiFetch("/api/auth/me");
        if (res.ok) {
          const userData = await res.json();
          setUser(userData.user);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    async function fetchWallet() {
      try {
        const res = await apiFetch("/api/driver/wallet");
        if (res.ok) {
          const walletData = await res.json();
          setData(walletData);
        }
      } catch (error) {
        console.error("Failed to fetch wallet:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchWallet();
  }, []);

  const logout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center">
        <Header role="driver" user={user} onLogout={logout} />
        <main className="relative p-6 w-full max-w-md flex flex-col gap-6 flex-1">
          <PageHeading title={t("wallet")} subtitle={t("my_earnings")} backHref="/driver" />
          <WalletSkeleton />
        </main>
      </div>
    );
  }

  const balance = data?.balance || 0;
  const isDebt = balance < 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <div className="fixed inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />

      <Header 
        role="driver" 
        user={user || data?.driver as unknown as UserType} 
        onLogout={logout} 
      />

      <main className="relative p-6 w-full max-w-md flex flex-col gap-6 flex-1">
        <PageHeading 
          title={t("wallet") as string} 
          subtitle={t("my_earnings") as string}
          backHref="/driver"
        />

        {/* Balance Card */}
        <Card className="relative overflow-hidden border-none bg-slate-900 text-white shadow-2xl rounded-[2.5rem]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-bl-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-tr-full blur-xl" />
          
          <CardContent className="p-8 relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary-light" />
              </div>
              <Badge variant="outline" className="border-white/20 text-white/60 font-black text-[10px] uppercase tracking-widest bg-white/5">
                {isDebt ? t("wallet_debt") : t("wallet_balance")}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">
                {isDebt ? t("total_debt") : t("wallet_balance")}
              </p>
              <h2 className={`text-5xl font-black tracking-tight ${isDebt ? "text-red-400" : "text-white"}`}>
                {t("currency")}{formatDecimal(Math.abs(balance))}
              </h2>
            </div>

            <div className="mt-8 flex gap-4">
              <AppButton 
                className="flex-1 h-14 bg-white text-slate-900 hover:bg-slate-100 font-black rounded-xl text-sm uppercase tracking-wider shadow-lg"
                onClick={() => {}}
              >
                {t("pay_debt")}
              </AppButton>
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                <Info className="w-6 h-6 text-white/40" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 items-start animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <Banknote className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-900 leading-snug">
              {t("debt_desc")}
            </p>
            <p className="text-[10px] text-amber-700/70 mt-1 font-medium">
              Every trip includes a 5% platform fee (min {t("currency")}10).
            </p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
              <History size={14} className="text-primary" />
              {t("wallet_history")}
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{data?.transactions.length || 0} Total</span>
          </div>

          <div className="flex flex-col gap-3 pb-10">
            {data?.transactions.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto opacity-50">
                  <Clock className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t("no_bookings")}</p>
              </div>
            ) : (
              data?.transactions.map((tx) => (
                <Card key={tx.id} className="border-none bg-white shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden group">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tx.amount < 0 ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"}`}>
                      {tx.amount < 0 ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[150px]">
                          {tx.type === "BOOKING_FEE" ? t("booking_fee") : tx.type}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400">
                          {new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, {new Date(tx.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <h4 className="text-sm font-black text-slate-800 leading-tight">
                            {tx.details}
                          </h4>
                          {tx.booking && (
                            <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5 flex items-center gap-1">
                              <Navigation size={8} /> {tx.booking.pickupAddress.split(",")[0]}
                            </p>
                          )}
                        </div>
                        <p className={`text-lg font-black ${tx.amount < 0 ? "text-red-500" : "text-emerald-500"}`}>
                          {tx.amount < 0 ? "-" : "+"}{t("currency")}{formatDecimal(Math.abs(tx.amount))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
