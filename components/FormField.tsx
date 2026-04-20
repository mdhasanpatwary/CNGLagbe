import React, { useState } from "react";
import { LucideIcon, Eye, EyeOff } from "lucide-react";
import { Input } from "./ui/input";

interface FormFieldProps {
  label: string;
  icon?: LucideIcon;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function FormField({
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
}: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const currentType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
        {label}
      </label>
      <div className="relative group">
        {Icon && (
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors z-10 pointer-events-none">
            <Icon size={20} />
          </div>
        )}
        <Input
          type={currentType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ 
            paddingLeft: Icon ? "60px" : "16px", 
            paddingRight: isPassword ? "50px" : "16px" 
          }}
          className="h-14 bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 transition-all rounded-2xl text-lg w-full"
          required={required}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors z-20 p-2"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    </div>
  );
}
