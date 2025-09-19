"use client";

import { useQueries } from "@tanstack/react-query";
import { fetchJSON } from "@/lib/fetch";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function AdminDashboard() {
  const [usersQuery, categoriesQuery, sizesQuery, templatesQuery] = useQueries({
    queries: [
      { queryKey: ["users"], queryFn: () => fetchJSON<{ users: any[] }>({ url: "/api/users" }) },
      { queryKey: ["categories"], queryFn: () => fetchJSON<{ categories: any[] }>({ url: "/api/categories" }) },
      { queryKey: ["sizes"], queryFn: () => fetchJSON<{ sizes: any[] }>({ url: "/api/sizes" }) },
      { queryKey: ["templates"], queryFn: () => fetchJSON<{ templates: any[] }>({ url: "/api/templates" }) }
    ]
  });

  const stats = [
    {
      title: "Active users",
      value: usersQuery.data?.users.length ?? "–",
      href: "/admin/users"
    },
    {
      title: "Categories",
      value: categoriesQuery.data?.categories.length ?? "–",
      href: "/admin/categories"
    },
    {
      title: "Sizes",
      value: sizesQuery.data?.sizes.length ?? "–",
      href: "/admin/sizes"
    },
    {
      title: "Templates",
      value: templatesQuery.data?.templates.length ?? "–",
      href: "/admin/templates"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">Operations overview</h1>
        <p className="mt-2 text-sm text-white/70">Track your workspace and jump into management tools.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-white/60">{stat.title}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
            </div>
            <Link href={stat.href}>
              <Button variant="outline" className="w-full">
                Manage
              </Button>
            </Link>
          </Card>
        ))}
      </div>
      <Card className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Seed instructions</h2>
        <p className="text-sm text-white/70">
          If this is your first deployment, call <code>/api/auth/seed-admin</code> via a tool like curl or Postman to create the initial administrator.
        </p>
        <pre className="overflow-x-auto rounded-2xl bg-black/50 p-4 text-xs text-white/80">
          {`curl -X POST https://your-site.netlify.app/api/auth/seed-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","username":"Admin","password":"ChangeMe123"}'`}
        </pre>
      </Card>
    </div>
  );
}
