"use client";

import { ReactNode } from "react";
import { useRequireRole } from "@/lib/auth";

export function AuthGate({ children, role }: { children: ReactNode; role?: "admin" | "user" }) {
  const { user, loading } = useRequireRole(role);
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white/70">
        {loading ? "Checking access…" : "Redirecting…"}
      </div>
    );
  }
  return <>{children}</>;
}
