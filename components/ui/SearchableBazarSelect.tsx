"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Plus, ChevronDown, Check, Store, AlertCircle, X } from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
import { useLang } from "@/hooks/useLang";
import { TextKey } from "@/constants/text";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isBanglaText, mapEnglishToBanglaBazars } from "@/lib/bazar-mapping";

interface Bazar {
  id: string;
  name: string;
  upazila?: string;
  district?: string;
}

interface SearchableBazarSelectProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
  allowAll?: boolean;
  size?: "sm" | "md" | "lg";
}

export function SearchableBazarSelect({
  value,
  onChange,
  error,
  label,
  required,
  allowAll,
  size = "lg",
}: SearchableBazarSelectProps) {
  const { t } = useLang();
  const [bazars, setBazars] = useState<Bazar[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingBazarName, setPendingBazarName] = useState("");
  const [pendingUpazila, setPendingUpazila] = useState("ছাগলনাইয়া");
  const [pendingDistrict, setPendingDistrict] = useState("ফেনী");
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchBazars = async () => {
    try {
      const res = await fetch("/api/bazars");
      if (res.ok) {
        const data = await res.json();
        setBazars(data);
      }
    } catch (e) {
      console.error("Error fetching bazars:", e);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBazars();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filtered = bazars.filter((bazar) => {
    const queryLower = searchQuery.toLowerCase().trim();
    if (!queryLower) return true;
    
    const nameMatch = bazar.name.toLowerCase().includes(queryLower);
    if (nameMatch) return true;

    // Check if searching in English and if the query maps to this bazar name
    if (/[a-zA-Z]/.test(queryLower)) {
      const mapped = mapEnglishToBanglaBazars(queryLower, bazars.map(b => b.name));
      return mapped.includes(bazar.name);
    }
    return false;
  });

  const handleSelect = (name: string) => {
    onChange(name);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleOpenConfirmModal = () => {
    const trimmed = searchQuery.trim();
    setPendingBazarName(trimmed);
    setPendingUpazila("ছাগলনাইয়া");
    setPendingDistrict("ফেনী");
    setShowConfirmModal(true);
  };

  const confirmAddNewBazar = async () => {
    const trimmedName = pendingBazarName.trim();
    const trimmedUpazila = pendingUpazila.trim();
    const trimmedDistrict = pendingDistrict.trim();

    if (!trimmedName) {
      toast.error("বাজারের নাম দিন");
      return;
    }
    if (!isBanglaText(trimmedName)) {
      toast.error("বাজারের নাম অবশ্যই বাংলায় লিখতে হবে");
      return;
    }
    if (!trimmedUpazila) {
      toast.error("উপজেলার নাম দিন");
      return;
    }
    if (!isBanglaText(trimmedUpazila)) {
      toast.error("উপজেলার নাম অবশ্যই বাংলায় লিখতে হবে");
      return;
    }
    if (!trimmedDistrict) {
      toast.error("জেলার নাম দিন");
      return;
    }
    if (!isBanglaText(trimmedDistrict)) {
      toast.error("জেলার নাম অবশ্যই বাংলায় লিখতে হবে");
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch("/api/bazars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          upazila: trimmedUpazila,
          district: trimmedDistrict,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(
          t("success_bazar_added" as TextKey) ||
            "Bazar submitted for approval!"
        );
        // Save to localStorage for tracking deletion reasons
        if (typeof window !== "undefined") {
          try {
            const stored = localStorage.getItem("my_contributed_bazars");
            const list = stored ? JSON.parse(stored) : [];
            if (Array.isArray(list) && !list.includes(data.name)) {
              list.push(data.name);
              localStorage.setItem("my_contributed_bazars", JSON.stringify(list));
            }
          } catch (e) {
            console.error("Failed to save contributed bazar to localStorage:", e);
          }
        }
        // Add to local list and select
        setBazars((prev) => [...prev, data]);
        onChange(data.name);
        setIsOpen(false);
        setSearchQuery("");
        setShowConfirmModal(false);
        setPendingBazarName("");
        setPendingUpazila("ছাগলনাইয়া");
        setPendingDistrict("ফেনী");
      } else if (data.error === "BAZAR_EXISTS") {
        toast.error(t("error_bazar_exists" as TextKey) || "Bazar already exists!");
      } else if (data.error === "UPAZILA_NAME_MUST_BE_BANGLA") {
        toast.error("উপজেলার নাম বাংলায় হতে হবে");
      } else if (data.error === "DISTRICT_NAME_MUST_BE_BANGLA") {
        toast.error("জেলার নাম বাংলায় হতে হবে");
      } else {
        toast.error("Failed to add bazar.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error adding bazar.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-2 relative w-full">
      {label && (
        <label className="text-xs font-black tracking-widest uppercase text-slate-400 ml-1">
          {label} {required && <span className="text-red-500 font-black">*</span>}
        </label>
      )}
      
      {/* Trigger Input */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "px-4 border transition-all flex items-center justify-between cursor-pointer text-slate-900 select-none",
          size === "sm" ? "h-9 rounded-xl" : size === "md" ? "h-12 rounded-xl" : "h-14 rounded-2xl",
          error ? "bg-red-50/50 border-red-200" : "bg-slate-50 border-slate-200 hover:border-slate-300",
          isOpen && "border-primary bg-white focus:ring-2 focus:ring-primary/20"
        )}
      >
        <span className={cn(
          "font-medium",
          size === "sm" ? "text-sm" : size === "md" ? "text-base" : "text-lg",
          !value && "text-slate-400"
        )}>
          {value === "ALL"
            ? (t("select_bazar_placeholder" as TextKey) || "All Stand/Bazar")
            : (value || t("select_bazar_placeholder" as TextKey) || "Select Bazar")}
        </span>
        <ChevronDown className={cn("text-slate-400", size === "sm" ? "w-4 h-4" : "w-5 h-5")} />
      </div>

      {error && (
        <span className="text-[10px] font-bold text-red-500 tracking-wider ml-1 mt-0.5">
          {error}
        </span>
      )}

      {/* Dropdown Container */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-200 shadow-2xl rounded-2xl z-50 overflow-hidden animate-in fade-in duration-100 p-2">
          {/* Search box inside dropdown */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search_bazar" as TextKey) || "Search bazar..."}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary bg-slate-50/50 font-medium"
              autoFocus
            />
          </div>

          {/* List items */}
          <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-thin">
            {allowAll && (!searchQuery.trim() || (t("select_bazar_placeholder" as TextKey) || "All Stand/Bazar").toLowerCase().includes(searchQuery.toLowerCase())) && (
              <div
                onClick={() => handleSelect("ALL")}
                className={cn(
                  "px-4 py-2.5 rounded-xl cursor-pointer text-sm font-medium flex items-center justify-between hover:bg-slate-50 transition-colors",
                  value === "ALL" && "bg-emerald-50 text-emerald-800"
                )}
              >
                <span>{t("select_bazar_placeholder" as TextKey) || "All Stand/Bazar"}</span>
                {value === "ALL" && <Check className="w-4 h-4 text-primary" />}
              </div>
            )}

            {filtered.map((bazar) => (
              <div
                key={bazar.id}
                onClick={() => handleSelect(bazar.name)}
                className={cn(
                  "px-4 py-2.5 rounded-xl cursor-pointer text-sm font-medium flex items-center justify-between hover:bg-slate-50 transition-colors",
                  value === bazar.name && "bg-emerald-50 text-emerald-800"
                )}
              >
                <span>{bazar.name}</span>
                {value === bazar.name && <Check className="w-4 h-4 text-primary" />}
              </div>
            ))}

            {/* If Bazar doesn't exist */}
            {filtered.length === 0 && searchQuery.trim() && !allowAll && (
              <div className="p-3 text-center border-t border-slate-100 mt-2">
                <p className="text-xs text-slate-500 mb-2 font-medium">
                  {t("cant_find_bazar" as TextKey) || "Can't find your bazar?"}
                </p>
                <AppButton
                  type="button"
                  onClick={handleOpenConfirmModal}
                  disabled={isAdding}
                  size="sm"
                  className="w-full h-10 rounded-xl text-xs font-bold bg-primary text-white hover:bg-success transition-all disabled:opacity-50"
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  <span>
                    &quot;{searchQuery}&quot; {t("add_new_bazar" as TextKey) || "Add Bazar"}
                  </span>
                </AppButton>
              </div>
            )}

            {filtered.length === 0 && !searchQuery.trim() && (
              <div className="py-4 text-center text-xs text-slate-400 font-medium">
                No bazars available.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-black text-lg">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <span>{t("confirm_add_bazar_title" as TextKey) || "নতুন বাজার যোগ করুন"}</span>
              </div>
              <AppButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingBazarName("");
                }}
                disabled={isAdding}
                className="p-1 h-auto rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </AppButton>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              নতুন বাজার যোগ করার জন্য বাজারের নাম, উপজেলা ও জেলার নাম দিন। বাজারটি অনুমোদনের জন্য জমা দেওয়া হবে।
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  বাজারের নাম <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={pendingBazarName}
                    onChange={(e) => setPendingBazarName(e.target.value)}
                    placeholder="যেমন: শুভপুর বাজার"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-primary focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  উপজেলা <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={pendingUpazila}
                  onChange={(e) => setPendingUpazila(e.target.value)}
                  placeholder="যেমন: ছাগলনাইয়া"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-primary focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  জেলা <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={pendingDistrict}
                  onChange={(e) => setPendingDistrict(e.target.value)}
                  placeholder="যেমন: ফেনী"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-primary focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <AppButton
                type="button"
                variant="outline"
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingBazarName("");
                }}
                disabled={isAdding}
                className="flex-1 h-11 rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                {t("confirm_bazar_cancel" as TextKey) || "বাতিল"}
              </AppButton>
              <AppButton
                type="button"
                onClick={confirmAddNewBazar}
                disabled={isAdding}
                loading={isAdding}
                className="flex-1 h-11 rounded-xl text-xs font-bold bg-primary text-white hover:bg-emerald-600"
              >
                {t("confirm_bazar_submit" as TextKey) || "হ্যাঁ, যোগ করুন"}
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

