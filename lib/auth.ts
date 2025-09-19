"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { fetchJSON } from "@/lib/fetch";
import { useAuth } from "@/lib/auth-context";
import { Role } from "@/lib/types";

export function useRequireRole(role?: Role) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (role && user.role !== role) {
      router.replace("/");
    }
  }, [user, loading, router, role]);

  return { user, loading };
}

export function login(email: string, password: string) {
  return fetchJSON<{ user: unknown }>({ url: "/api/auth/login", method: "POST", body: { email, password } });
}

export function logout() {
  return fetchJSON<{ ok: boolean }>({ url: "/api/auth/logout", method: "POST" });
}

export function updateProfile(payload: Record<string, unknown>) {
  return fetchJSON<{ profile: unknown }>({ url: "/api/profile", method: "PATCH", body: payload });
}

export function fetchProfile() {
  return fetchJSON<{ profile: unknown }>({ url: "/api/profile" });
}
