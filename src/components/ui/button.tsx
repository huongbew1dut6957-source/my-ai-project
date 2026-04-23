import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
  }
>;

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" &&
          "bg-slate-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)] hover:bg-slate-800",
        variant === "secondary" &&
          "border border-black/10 bg-white text-slate-900 hover:bg-slate-50",
        variant === "ghost" &&
          "text-slate-700 hover:bg-black/5",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

