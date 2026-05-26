"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import { type Language } from "@/constants/text";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  isReady: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("bn");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("app-lang") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "bn")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLangState(savedLang);
    }
    setIsReady(true);
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("app-lang", newLang);
    
    // Also set a cookie for server-side access (like manifest.json)
    const isProd = process.env.NODE_ENV === "production";
    const isConfiguredHost = typeof window !== "undefined" && (
      window.location.host === "cnglagbe.com" || 
      window.location.host === "driver.cnglagbe.com" || 
      window.location.host.endsWith(".cnglagbe.com")
    );
    const domain = (isProd && isConfiguredHost) ? ".cnglagbe.com" : "";
    const domainString = domain ? `; domain=${domain}` : "";
    document.cookie = `app-lang=${newLang}; path=/; max-age=31536000${domainString}; SameSite=Lax${isProd ? "; Secure" : ""}`;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, isReady }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguageContext must be used within a LanguageProvider");
  }
  return context;
}
