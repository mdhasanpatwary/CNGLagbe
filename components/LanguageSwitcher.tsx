// Follow UI rules from /docs/ui-rules.md
"use client";

import { useLang } from "@/hooks/useLang";
import { AppButton } from "@/components/ui/AppButton";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div className="flex items-center bg-slate-100/80 p-1 rounded-full border border-slate-200/50 shadow-inner">
      <AppButton
        variant="ghost"
        onClick={() => setLang("bn")}
        className={cn(
          "px-3 py-1 h-auto rounded-full text-[10px] font-black tracking-wider transition-all duration-300 border-none",
          lang === "bn" 
            ? "bg-white text-primary shadow-sm hover:bg-white" 
            : "text-slate-400 hover:text-slate-600 bg-transparent hover:bg-transparent"
        )}
      >
        বাংলা
      </AppButton>
      <AppButton
        variant="ghost"
        onClick={() => setLang("en")}
        className={cn(
          "px-3 py-1 h-auto rounded-full text-[10px] font-black tracking-wider transition-all duration-300 border-none",
          lang === "en" 
            ? "bg-white text-primary shadow-sm hover:bg-white" 
            : "text-slate-400 hover:text-slate-600 bg-transparent hover:bg-transparent"
        )}
      >
        EN
      </AppButton>
    </div>
  );
}
