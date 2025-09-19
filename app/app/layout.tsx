import { ReactNode } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutButton } from "@/components/LogoutButton";

export default function AppLayout({ children }: { children: ReactNode }) {
  const nav = [
    { href: "/app", label: "Overview" },
    { href: "/app/profile", label: "Profile" },
    { href: "/app/gallery", label: "Gallery" }
  ];

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/app" className="text-xl font-semibold text-white">
              FilingsCenter
            </Link>
            <nav className="flex items-center gap-4 text-sm text-white/70">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              ))}
              <ThemeToggle />
              <LogoutButton />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
      </div>
    </AuthGate>
  );
}
