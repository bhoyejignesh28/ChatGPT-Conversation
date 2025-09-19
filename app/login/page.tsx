"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { login } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
    onSuccess: () => {
      router.replace("/app");
    },
    onError: (err: Error) => {
      setError(err.message);
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    mutation.mutate({ email, password });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-10 shadow-soft">
        <h1 className="text-3xl font-semibold text-white">Sign in to FilingsCenter</h1>
        <p className="mt-3 text-sm text-white/70">
          Use the credentials provided by your administrator. First-time setup? Ask your admin to run the seed function.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-white/60">Email</label>
            <Input name="email" type="email" required placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-white/60">Password</label>
            <Input name="password" type="password" required placeholder="••••••••" />
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <Button type="submit" className="w-full py-3" disabled={mutation.isPending}>
            {mutation.isPending ? "Signing in…" : "Sign In"}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-white/60">
          Need access? <Link href="/" className="text-primary">Return home</Link>
        </div>
      </div>
    </main>
  );
}
