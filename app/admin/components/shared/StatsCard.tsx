"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { formatDecimal } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  desc?: string;
  description?: string;
  icon: LucideIcon;
  variant?: "primary" | "blue" | "purple" | "amber";
  currency?: string;
  extra?: ReactNode;
  children?: ReactNode;
}

export const StatsCard = ({
  title,
  value,
  desc,
  description,
  icon: Icon,
  variant = "primary",
  currency,
  extra,
  children
}: StatsCardProps) => {
  const variantStyles = {
    primary: { bg: "bg-primary/10", text: "text-primary" },
    blue: { bg: "bg-blue-100", text: "text-blue-600" },
    purple: { bg: "bg-purple-100", text: "text-purple-600" },
    amber: { bg: "bg-amber-100", text: "text-amber-600" },
  };

  const { bg, text } = variantStyles[variant] || variantStyles.primary;

  return (
    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {title}
        </CardTitle>
        <div className={`${bg} p-2 rounded-lg`}>
          <Icon className={`h-4 w-4 ${text}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black flex items-center gap-1.5 text-slate-900">
          {currency && <span className="text-sm font-black text-slate-400">{currency}</span>}
          {typeof value === 'number' ? formatDecimal(value) : value}
        </div>
        {(desc || description) && (
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">
            {desc || description}
          </p>
        )}
        {extra}
        {children}
      </CardContent>
    </Card>
  );
};

