"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical root layout error:", error);
  }, [error]);

  return (
    <html lang="bn">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-4 antialiased">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-800">
              অ্যাপ্লিকেশনে ত্রুটি ঘটেছে
            </h2>
            <p className="text-sm text-slate-600">
              অ্যাপ্লিকেশনের মূল স্ট্রাকচারে ত্রুটি দেখা দিয়েছে। অনুগ্রহ করে পেজটি রিফ্রেশ করুন।
            </p>
            {error.digest && (
              <p className="text-xs text-slate-400 font-mono mt-2">
                Ref: {error.digest}
              </p>
            )}
          </div>

          {/* eslint-disable-next-line no-restricted-syntax */}
          <button
            type="button"
            onClick={() => reset()}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>পুনরায় চেষ্টা করুন</span>
          </button>
        </div>
      </body>
    </html>
  );
}
