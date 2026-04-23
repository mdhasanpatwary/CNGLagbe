import React, { useState, forwardRef } from "react";
import { LucideIcon, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Input } from "./ui/input";
import { AppButton } from "./ui/AppButton";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  onValueChange?: (val: string) => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement> | ((event: { target: unknown; type?: unknown }) => Promise<void | boolean>);
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(({
  label,
  icon: Icon,
  type = "text",
  error,
  placeholder,
  className,
  onValueChange,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const currentType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center ml-1">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
          {label}
        </label>
        {error && (
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider animate-in fade-in slide-in-from-right-1">
            {error}
          </span>
        )}
      </div>
      <div className="relative group">
        {Icon && (
          <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors z-10 pointer-events-none ${error ? 'text-red-400' : 'text-slate-400 group-focus-within:text-emerald-500'}`}>
            <Icon size={20} />
          </div>
        )}
        <Input
          {...props}
          ref={ref}
          type={currentType}
          placeholder={placeholder}
          onChange={(e) => {
            props.onChange?.(e);
            onValueChange?.(e.target.value);
          }}
          style={{ 
            paddingLeft: Icon ? "60px" : "16px", 
            paddingRight: (isPassword || error) ? "50px" : "16px" 
          }}
          className={`h-14 transition-all rounded-2xl text-lg w-full font-medium ${
            error 
              ? "bg-red-50/50 border-red-200 focus:border-red-500 text-red-900 placeholder:text-red-300" 
              : "bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500"
          } ${className}`}
        />
        
        {isPassword ? (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 z-20">
            <AppButton
              variant="ghost"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`w-12 h-12 p-0 hover:bg-transparent ${error ? 'text-red-400' : 'text-slate-400 hover:text-emerald-500'}`}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </AppButton>
          </div>
        ) : error ? (
           <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none">
             <AlertCircle size={20} />
           </div>
        ) : null}
      </div>
    </div>
  );
});

FormField.displayName = "FormField";
