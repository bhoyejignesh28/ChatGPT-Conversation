"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchJSON } from "@/lib/fetch";
import { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => fetchJSON<User | null>({ url: "/api/auth/me" })
  });

  const value = useMemo(
    () => ({
      user: data ?? null,
      loading: isLoading,
      refetch
    }),
    [data, isLoading, refetch]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
