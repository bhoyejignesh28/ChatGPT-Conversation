"use client";

import Link from "next/link";
import { FormEvent } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { fetchJSON } from "@/lib/fetch";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function TemplatesAdminPage() {
  const queryClient = useQueryClient();
  const [templatesQuery, categoriesQuery, sizesQuery] = useQueries({
    queries: [
      { queryKey: ["templates"], queryFn: () => fetchJSON<{ templates: any[] }>({ url: "/api/templates" }) },
      { queryKey: ["categories"], queryFn: () => fetchJSON<{ categories: any[] }>({ url: "/api/categories" }) },
      { queryKey: ["sizes"], queryFn: () => fetchJSON<{ sizes: any[] }>({ url: "/api/sizes" }) }
    ]
  });

  const templates = templatesQuery.data?.templates || [];
  const categories = categoriesQuery.data?.categories || [];
  const sizes = sizesQuery.data?.sizes || [];

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; categoryId: string; sizeId: string }) =>
      fetchJSON({ url: "/api/templates", method: "POST", body: payload }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates"] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchJSON({ url: `/api/templates?id=${id}`, method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates"] })
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    const categoryId = String(form.get("categoryId"));
    const sizeId = String(form.get("sizeId"));
    createMutation.mutate({ name, categoryId, sizeId });
    event.currentTarget.reset();
  };

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-2xl font-semibold text-white">Create template</h1>
        <form onSubmit={handleCreate} className="mt-4 grid gap-4 md:grid-cols-4">
          <Input name="name" placeholder="Template name" required />
          <select name="categoryId" className="rounded-2xl bg-white/5 px-4 py-2 text-sm" required>
            <option value="">Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select name="sizeId" className="rounded-2xl bg-white/5 px-4 py-2 text-sm" required>
            <option value="">Size</option>
            {sizes.map((size) => (
              <option key={size.id} value={size.id}>
                {size.name}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating…" : "Create"}
          </Button>
        </form>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">{template.name}</h2>
                <p className="text-sm text-white/60">
                  {categories.find((category) => category.id === template.categoryId)?.name || "Uncategorized"}
                </p>
              </div>
              <Button variant="ghost" onClick={() => deleteMutation.mutate(template.id)}>
                Delete
              </Button>
            </div>
            {template.baseImageUrl && (
              <img src={template.baseImageUrl} alt={template.name} className="h-40 w-full rounded-2xl object-cover" />
            )}
            <div className="flex justify-end">
              <Link href={`/admin/templates/${template.id}`}>
                <Button variant="outline">Edit</Button>
              </Link>
            </div>
          </Card>
        ))}
        {templates.length === 0 && <Card>No templates created yet.</Card>}
      </div>
    </div>
  );
}
