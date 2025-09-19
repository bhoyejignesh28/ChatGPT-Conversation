import { ReactNode } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const nav = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/sizes", label: "Sizes" },
    { href: "/admin/templates", label: "Templates" }
  ];

  return (
    <AuthGate role="admin">
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/admin" className="text-xl font-semibold text-white">
              FilingsCenter Admin
            </Link>
            <nav className="flex items-center gap-4 text-sm text-white/70">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              ))}
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      </div>
    </AuthGate>
  );
}
