"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchJSON } from "@/lib/fetch";
import { Button } from "@/components/ui/Button";
import { Category, Size, Template } from "@/lib/types";

export default function GalleryPage() {
  const [categoryId, setCategoryId] = useState<string | "all">("all");
  const [sizeId, setSizeId] = useState<string | "all">("all");

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: () => fetchJSON<{ categories: Category[] }>({ url: "/api/categories" }) });
  const sizesQuery = useQuery({ queryKey: ["sizes"], queryFn: () => fetchJSON<{ sizes: Size[] }>({ url: "/api/sizes" }) });
  const templatesQuery = useQuery({ queryKey: ["templates"], queryFn: () => fetchJSON<{ templates: Template[] }>({ url: "/api/templates" }) });

  const templates = useMemo(() => {
    return (templatesQuery.data?.templates || []).filter((template) => {
      if (categoryId !== "all" && template.categoryId !== categoryId) return false;
      if (sizeId !== "all" && template.sizeId !== sizeId) return false;
      return true;
    });
  }, [templatesQuery.data, categoryId, sizeId]);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-3xl font-semibold text-white">Template gallery</h1>
        <p className="mt-2 text-sm text-white/70">Filter by category and size to find the perfect layout.</p>
        <div className="mt-6 flex flex-wrap gap-4">
          <select
            className="rounded-2xl bg-white/5 px-4 py-2 text-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value as any)}
          >
            <option value="all">All categories</option>
            {categoriesQuery.data?.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select className="rounded-2xl bg-white/5 px-4 py-2 text-sm" value={sizeId} onChange={(e) => setSizeId(e.target.value as any)}>
            <option value="all">All sizes</option>
            {sizesQuery.data?.sizes.map((size) => (
              <option key={size.id} value={size.id}>
                {size.name} ({size.w}×{size.h})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {templates.map((template) => (
          <div key={template.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{template.name}</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70">
                {sizesQuery.data?.sizes.find((size) => size.id === template.sizeId)?.name}
              </span>
            </div>
            <p className="mt-2 text-sm text-white/50">
              {categoriesQuery.data?.categories.find((category) => category.id === template.categoryId)?.name || "Uncategorized"}
            </p>
            {template.baseImageUrl && (
              <img src={template.baseImageUrl} alt={template.name} className="mt-4 h-48 w-full rounded-2xl object-cover" />
            )}
            <div className="mt-4 flex justify-end">
              <Link href={`/app/editor/${template.id}`}>
                <Button>Open editor</Button>
              </Link>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60">No templates match your filters.</div>
        )}
      </div>
    </div>
  );
}
