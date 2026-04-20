// Follow UI rules from /docs/ui-rules.md
"use client";

import { useLang } from "@/hooks/useLang";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border shadow-sm">
      <div className="pl-2 pr-1 text-slate-400">
        <Languages size={14} />
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLang("bn")}
        className={cn(
          "rounded-full px-3 transition-all duration-300 h-7 text-[10px] font-bold",
          lang === "bn" 
            ? "bg-white text-emerald-600 shadow-sm hover:bg-white" 
            : "text-slate-500 hover:text-slate-900"
        )}
      >
        বাংলা
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLang("en")}
        className={cn(
          "rounded-full px-3 transition-all duration-300 h-7 text-[10px] font-bold",
          lang === "en" 
            ? "bg-white text-emerald-600 shadow-sm hover:bg-white" 
            : "text-slate-500 hover:text-slate-900"
        )}
      >
        EN
      </Button>
    </div>
  );
}
