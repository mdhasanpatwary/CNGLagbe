"use client";

import { AppButton } from "@/components/ui/AppButton";
import { LucideIcon } from "lucide-react";

export type AdminTab = "overview" | "drivers" | "users" | "logs" | "bazars" | "settings" | "issues" | "waitlist";

interface TabItem {
  id: AdminTab;
  label: string;
  icon: LucideIcon;
}

interface TabNavigationProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  tabs: TabItem[];
}

export const TabNavigation = ({ activeTab, onTabChange, tabs }: TabNavigationProps) => {
  return (
    <div className="flex items-center gap-1 mb-10 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-slate-200/50 w-fit relative">
      {tabs.map((tab) => (
        <AppButton
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          variant={activeTab === tab.id ? "primary" : "ghost"}
          className={`relative px-6 h-11 flex items-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 z-10 ${
            activeTab === tab.id
              ? "text-white bg-slate-900 shadow-lg shadow-slate-900/20"
              : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
          }`}
        >
          <tab.icon size={14} className={activeTab === tab.id ? "text-primary" : ""} />
          {tab.label}
        </AppButton>
      ))}
    </div>
  );
};
