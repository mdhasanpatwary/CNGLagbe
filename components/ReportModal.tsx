"use client";

import { useState } from "react";
import { X, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/useLang";

interface ReportModalProps {
  bookingId: string;
  onClose: () => void;
}

export function ReportModal({ bookingId, onClose }: ReportModalProps) {
  const { t } = useLang();
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const reasons = [
    { id: "fare", label: t("reason_fare") },
    { id: "noshow", label: t("reason_noshow") },
    { id: "misconduct", label: t("reason_misconduct") },
    { id: "other", label: t("reason_other") },
  ];

  const handleSubmit = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/booking/${bookingId}/report`, {
        method: "POST",
        body: JSON.stringify({ reason, details }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(onClose, 2000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={24} />
              {t("report_issue")}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-400">
              <X size={20} />
            </button>
          </div>

          {success ? (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in-90 duration-500">
              <div className="bg-emerald-100 p-6 rounded-full mb-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-800">{t("report_success")}</h3>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {reasons.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setReason(r.id)}
                    className={`py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all active:scale-95 ${
                      reason === r.id
                        ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                        : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {t("details_label")}
                </label>
                <textarea
                  className="w-full bg-slate-50 border-none rounded-[1.5rem] p-4 text-sm focus:ring-2 focus:ring-slate-200 transition-all min-h-[100px] outline-none"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="..."
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!reason || loading}
                className="w-full h-14 rounded-2xl text-base font-black shadow-xl"
              >
                {loading ? <Loader2 className="animate-spin" /> : t("submit_report")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
