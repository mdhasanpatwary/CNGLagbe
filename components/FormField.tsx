import React, { useState, forwardRef } from "react";
import { LucideIcon, Eye, EyeOff, AlertCircle, Lock } from "lucide-react";
import { Input } from "./ui/input";
import { AppButton } from "./ui/AppButton";
import { cn } from "@/lib/utils";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  onValueChange?: (val: string) => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement> | ((event: { target: unknown; type?: unknown }) => Promise<void | boolean>);
  required?: boolean;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(({
  label,
  icon: Icon,
  type = "text",
  error,
  placeholder,
  className,
  onValueChange,
  required,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const currentType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={cn("flex flex-col gap-2", props.disabled && "opacity-80")}>
      <div className="flex justify-between items-center ml-1">
        <label className={cn(
          "text-xs font-black tracking-widest flex items-center gap-1",
          props.disabled ? "text-slate-400" : "text-slate-400"
        )}>
          {label}
          {required && <span className="text-red-500 font-black ml-0.5">*</span>}
          {props.disabled && <Lock size={12} className="text-slate-400" />}
        </label>
        {error && (
          <span className="text-[10px] font-bold text-red-500 tracking-wider animate-in fade-in slide-in-from-right-1">
            {error}
          </span>
        )}
      </div>
      <div className="relative group">
        {Icon && (
          <div className={cn(
            "absolute left-5 top-1/2 -translate-y-1/2 transition-colors z-10 pointer-events-none",
            error ? 'text-red-400' : (props.disabled ? 'text-slate-300' : 'text-slate-400 group-focus-within:text-primary')
          )}>
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
          className={cn(
            "h-14 transition-all rounded-2xl text-lg w-full font-medium border-slate-200",
            error 
              ? "bg-red-50/50 border-red-200 focus:border-red-500 text-red-900 placeholder:text-red-300" 
              : "bg-slate-50 focus:bg-white focus:border-primary",
            props.disabled && "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed",
            className
          )}
        />
        
        {isPassword ? (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 z-20">
            <AppButton
              variant="ghost"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`w-12 h-12 p-0 hover:bg-transparent ${error ? 'text-red-400' : 'text-slate-400 hover:text-primary'}`}
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
