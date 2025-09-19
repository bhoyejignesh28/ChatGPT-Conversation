"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { logout } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: () => router.replace("/login")
  });

  return (
    <Button variant="ghost" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
      {mutation.isPending ? "Signing out…" : "Logout"}
    </Button>
  );
}
