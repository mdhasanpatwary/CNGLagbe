"use client";

import { useCallback, useMemo } from "react";
import { useLanguageContext } from "@/context/LanguageContext";
import { TEXT, type TextKey } from "@/constants/text";

export function useLang() {
  const { lang, setLang, isReady } = useLanguageContext();

  /**
   * Translation function
   * @param key The key from TEXT dictionary
   * @returns Translated string
   */
  const t = useCallback(
    (key: TextKey): string => {
      const translation = TEXT[key];
      if (!translation) return key;
      
      return translation[lang] || translation["en"] || key;
    },
    [lang]
  );

  return useMemo(() => ({
    lang,
    setLang,
    t,
    isReady
  }), [lang, setLang, t, isReady]);
}
