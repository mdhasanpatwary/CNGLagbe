"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled runtime application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-800">
            একটি অপ্রত্যাশিত সমস্যা হয়েছে
          </h2>
          <p className="text-sm text-slate-600">
            সিস্টেমে সাময়িক সমস্যা দেখা দিয়েছে। আমরা বিষয়টি সম্পর্কে অবগত এবং দ্রুত সমাধানের চেষ্টা করছি।
          </p>
          {error.digest && (
            <p className="text-xs text-slate-400 font-mono mt-2">
              Error Ref: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <AppButton
            variant="primary"
            fullWidth
            onClick={() => reset()}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            পুনরায় চেষ্টা করুন
          </AppButton>
          <Link href="/" className="w-full">
            <AppButton
              variant="outline"
              fullWidth
              leftIcon={<Home className="w-4 h-4" />}
            >
              হোমপেজে যান
            </AppButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
