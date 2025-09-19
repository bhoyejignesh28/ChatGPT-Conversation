"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "outline" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "px-5 py-2 rounded-2xl text-sm font-semibold transition-all duration-150",
          "shadow-soft disabled:opacity-60 disabled:cursor-not-allowed",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90": variant === "primary",
            "border border-primary/40 text-primary hover:bg-primary/10": variant === "outline",
            "text-foreground hover:bg-white/5": variant === "ghost"
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
