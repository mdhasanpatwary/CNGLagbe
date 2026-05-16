"use client";

import { AppButton } from "@/components/ui/AppButton";
import { Trash2 } from "lucide-react";
import { PendingDriver } from "@/lib/types/admin";
import { TextKey } from "@/constants/text";

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: PendingDriver | null;
  rechargeAmount: string;
  setRechargeAmount: (amount: string) => void;
  rechargeNote: string;
  setRechargeNote: (note: string) => void;
  handleRecharge: () => void;
  isRecharging: boolean;
  t: (key: TextKey) => string;
}

export function RechargeModal({
  isOpen,
  onClose,
  driver,
  rechargeAmount,
  setRechargeAmount,
  rechargeNote,
  setRechargeNote,
  handleRecharge,
  isRecharging,
  t,
}: RechargeModalProps) {
  if (!isOpen || !driver) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{t("wallet_recharge")}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{driver.name}</p>
          </div>
          <AppButton
            variant="ghost"
            onClick={onClose}
            className="w-10 h-10 p-0 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Trash2 size={18} className="rotate-45" />
          </AppButton>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t("recharge_amount")}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary">{t("currency")}</span>
              <input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-14 pl-12 pr-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-lg focus:outline-none focus:border-primary/30 transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t("recharge_details")}</label>
            <textarea
              value={rechargeNote}
              onChange={(e) => setRechargeNote(e.target.value)}
              placeholder={t("payment_collected") as string}
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-primary/30 transition-all min-h-[100px] resize-none"
            />
          </div>
          <AppButton
            onClick={handleRecharge}
            disabled={isRecharging || !rechargeAmount || isNaN(Number(rechargeAmount))}
            loading={isRecharging}
            className="w-full h-14 bg-primary hover:bg-primary-dark text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
          >
            {t("recharge_btn")}
          </AppButton>
        </div>
      </div>
    </div>
  );
}
