import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  isDisabled = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}) => {
  const isButtonDisabled = disabled || isDisabled || isLoading;

  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 min-h-[44px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 select-none active:scale-[0.98]";

  const sizeStyles = {
    sm: "px-3.5 py-2 text-xs min-h-[38px] rounded-lg",
    md: "px-5 py-2.5 text-sm min-h-[44px]",
    lg: "px-6 py-3.5 text-base min-h-[48px]",
  };

  const variantStyles = {
    primary:
      "bg-blue-600 hover:bg-blue-500 text-white shadow-sm border border-blue-500",
    secondary:
      "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 shadow-sm",
    outline:
      "bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-sm",
    ghost:
      "text-slate-400 hover:text-white hover:bg-slate-800/80",
    danger:
      "bg-red-600 hover:bg-red-500 text-white shadow-sm border border-red-500",
  };

  return (
    <button
      disabled={isButtonDisabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : leftIcon ? (
        <span className="mr-2 inline-flex items-center">{leftIcon}</span>
      ) : null}
      <span className="tracking-tight">{children}</span>
      {!isLoading && rightIcon ? (
        <span className="ml-2 inline-flex items-center">{rightIcon}</span>
      ) : null}
    </button>
  );
};
