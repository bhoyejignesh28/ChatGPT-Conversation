"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJSON } from "@/lib/fetch";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SizesPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["sizes"], queryFn: () => fetchJSON<{ sizes: any[] }>({ url: "/api/sizes" }) });
  const sizes = data?.sizes || [];

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; w: number; h: number }) => fetchJSON({ url: "/api/sizes", method: "POST", body: payload }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sizes"] })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, w, h }: { id: string; name?: string; w?: number; h?: number }) =>
      fetchJSON({ url: `/api/sizes?id=${id}`, method: "PATCH", body: { name, w, h } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sizes"] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchJSON({ url: `/api/sizes?id=${id}`, method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sizes"] })
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    const w = Number(form.get("w"));
    const h = Number(form.get("h"));
    createMutation.mutate({ name, w, h });
    event.currentTarget.reset();
  };

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-2xl font-semibold text-white">Create size</h1>
        <form onSubmit={handleCreate} className="mt-4 grid gap-4 md:grid-cols-4">
          <Input name="name" placeholder="Card size" required />
          <Input name="w" type="number" placeholder="Width" required />
          <Input name="h" type="number" placeholder="Height" required />
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating…" : "Create"}
          </Button>
        </form>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {sizes.map((size) => (
          <Card key={size.id} className="space-y-3">
            <form
              className="grid gap-3 md:grid-cols-4"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                updateMutation.mutate({
                  id: size.id,
                  name: String(form.get("name")),
                  w: Number(form.get("w")),
                  h: Number(form.get("h"))
                });
              }}
            >
              <Input name="name" defaultValue={size.name} />
              <Input name="w" type="number" defaultValue={size.w} />
              <Input name="h" type="number" defaultValue={size.h} />
              <Button type="submit" variant="outline">
                Save
              </Button>
            </form>
            <Button variant="ghost" onClick={() => deleteMutation.mutate(size.id)}>
              Delete
            </Button>
          </Card>
        ))}
        {sizes.length === 0 && <Card>No sizes configured yet.</Card>}
      </div>
    </div>
  );
}
