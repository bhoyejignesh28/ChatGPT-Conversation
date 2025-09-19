"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJSON } from "@/lib/fetch";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["categories"], queryFn: () => fetchJSON<{ categories: any[] }>({ url: "/api/categories" }) });
  const categories = data?.categories || [];

  const createMutation = useMutation({
    mutationFn: (payload: { name: string }) => fetchJSON({ url: "/api/categories", method: "POST", body: payload }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      fetchJSON({ url: `/api/categories?id=${id}`, method: "PATCH", body: { name } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchJSON({ url: `/api/categories?id=${id}`, method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] })
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    createMutation.mutate({ name });
    event.currentTarget.reset();
  };

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-2xl font-semibold text-white">Create category</h1>
        <form onSubmit={handleCreate} className="mt-4 flex gap-4">
          <Input name="name" placeholder="Category name" required />
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating…" : "Create"}
          </Button>
        </form>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((category) => (
          <Card key={category.id} className="flex items-center justify-between gap-4">
            <RenameInline
              defaultValue={category.name}
              onRename={(name) => updateMutation.mutate({ id: category.id, name })}
            />
            <Button variant="ghost" onClick={() => deleteMutation.mutate(category.id)}>
              Delete
            </Button>
          </Card>
        ))}
        {categories.length === 0 && <Card>No categories created yet.</Card>}
      </div>
    </div>
  );
}

function RenameInline({ defaultValue, onRename }: { defaultValue: string; onRename: (value: string) => void }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <form
      className="flex flex-1 items-center gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onRename(value);
      }}
    >
      <Input value={value} onChange={(e) => setValue(e.target.value)} />
      <Button type="submit" variant="outline">
        Save
      </Button>
    </form>
  );
}
