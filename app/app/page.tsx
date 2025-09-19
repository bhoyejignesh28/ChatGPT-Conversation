"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchJSON } from "@/lib/fetch";
import { Render } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export default function AppHome() {
  const { data, isLoading } = useQuery({
    queryKey: ["renders", "mine"],
    queryFn: () => fetchJSON<{ renders: Render[] }>({ url: "/api/renders?mine=1" })
  });

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-3xl font-semibold text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-white/70">Select a template from the gallery to begin editing, or revisit your latest renders below.</p>
        <div className="mt-6">
          <Link href="/app/gallery">
            <Button>Browse Templates</Button>
          </Link>
        </div>
      </section>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Recent renders</h2>
          <Link href="/app/gallery" className="text-sm text-primary">
            View more
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {isLoading && <div className="text-white/60">Loading renders…</div>}
          {!isLoading && data?.renders.length === 0 && <div className="text-white/60">No renders yet.</div>}
          {data?.renders.map((render) => (
            <div key={render.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/70">Template: {render.templateId}</div>
              <div className="mt-2 text-xs text-white/50">Updated {new Date(render.updatedAt).toLocaleString()}</div>
              {render.exportUrl && (
                <img src={render.exportUrl} alt="Render preview" className="mt-3 h-40 w-full rounded-xl object-cover" />
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
