import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 text-center space-y-6">
        <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            পেজটি পাওয়া যায়নি (404)
          </h2>
          <p className="text-sm text-slate-600">
            আপনি যে ঠিকানাটি খুঁজছেন সেটি ভুল অথবা সরিয়ে ফেলা হয়েছে।
          </p>
        </div>

        <div className="pt-2">
          <Link href="/" className="block w-full">
            <AppButton
              variant="primary"
              fullWidth
              leftIcon={<Home className="w-4 h-4" />}
            >
              হোমপেজে ফিরে যান
            </AppButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
