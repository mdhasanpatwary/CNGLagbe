// Follow UI rules from /docs/ui-rules.md
"use client";

import { useLang } from "@/hooks/useLang";
import { AppButton } from "@/components/ui/AppButton";
import { cn } from "@/lib/utils";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border shadow-sm">
      <div className="pl-2 pr-1 text-slate-400">
        <Languages size={18} />
      </div>
      <AppButton
        variant={lang === "bn" ? "primary" : "ghost"}
        onClick={() => setLang("bn")}
        className={cn(
          "rounded-xl px-4 transition-all duration-300 h-12 text-sm font-black",
          lang === "bn" 
            ? "bg-white text-emerald-600 shadow-sm hover:bg-white" 
            : "text-slate-500 hover:text-slate-900"
        )}
      >
        বাংলা
      </AppButton>
      <AppButton
        variant={lang === "en" ? "primary" : "ghost"}
        onClick={() => setLang("en")}
        className={cn(
          "rounded-xl px-4 transition-all duration-300 h-12 text-sm font-black",
          lang === "en" 
            ? "bg-white text-emerald-600 shadow-sm hover:bg-white" 
            : "text-slate-500 hover:text-slate-900"
        )}
      >
        EN
      </AppButton>
    </div>
  );
}
