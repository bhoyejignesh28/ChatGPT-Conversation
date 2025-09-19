"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-2 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
