"use client";

import { ReactNode, useEffect } from "react";
import { useTheme } from "next-themes";
import { AuthProvider } from "@/lib/auth-context";

export function Providers({ children }: { children: ReactNode }) {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);

  return <AuthProvider>{children}</AuthProvider>;
}
