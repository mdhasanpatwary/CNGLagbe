"use client";

import { useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/useLang";
import { TEXT, type TextKey } from "@/constants/text";

interface CancelModalProps {
  bookingId: string;
  onClose: () => void;
  onSuccess: () => void;
  role: "USER" | "DRIVER";
}

const USER_CANCELLATION_REASONS: TextKey[] = [
  "reason_changed_mind",
  "reason_driver_late",
  "reason_vehicle_issue",
  "reason_long_wait",
  "reason_other",
];

const DRIVER_CANCELLATION_REASONS: TextKey[] = [
  "reason_user_noshow",
  "reason_vehicle_issue",
  "reason_other",
];

export function CancelModal({ bookingId, onClose, onSuccess, role }: CancelModalProps) {
  const { t } = useLang();
  const [selectedReason, setSelectedReason] = useState<TextKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasons = role === "USER" ? USER_CANCELLATION_REASONS : DRIVER_CANCELLATION_REASONS;

  const handleCancel = async () => {
    if (!selectedReason) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/booking/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: t(selectedReason) }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.driverForcedOffline) {
          // Special case for driver UI handling
          window.dispatchEvent(new CustomEvent("FORCED_OFFLINE"));
        }
        onSuccess();
      } else {
        setError(data.message || t("error"));
      }
    } catch (err) {
      setError(t("network_error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-red-100 p-2 rounded-xl text-red-600">
                <AlertTriangle size={20} />
              </div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                {t("cancel_booking")}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
            {t("select_reason")}
          </p>

          <div className="space-y-3 mb-8">
            {reasons.map((reasonKey) => (
              <button
                key={reasonKey}
                onClick={() => setSelectedReason(reasonKey)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all font-bold text-sm ${
                  selectedReason === reasonKey
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-slate-100 hover:border-slate-200 text-slate-600 bg-slate-50/50"
                }`}
              >
                {t(reasonKey)}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-2">
              <X size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]"
              disabled={isLoading}
            >
              {t("back")}
            </Button>
            <Button
              onClick={handleCancel}
              disabled={!selectedReason || isLoading}
              className="flex-1 h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-600/20"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                t("confirm_cancel")
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
