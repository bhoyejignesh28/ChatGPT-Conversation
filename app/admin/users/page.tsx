"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJSON } from "@/lib/fetch";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function UsersAdminPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["users"], queryFn: () => fetchJSON<{ users: any[] }>({ url: "/api/users" }) });
  const users = data?.users || [];

  const createMutation = useMutation({
    mutationFn: (payload: { email: string; username: string; password: string; role: "admin" | "user" }) =>
      fetchJSON({ url: "/api/users", method: "POST", body: payload }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] })
  });

  const statusMutation = useMutation({
    mutationFn: ({ uid, status }: { uid: string; status: "active" | "inactive" }) =>
      fetchJSON({ url: `/api/users/${uid}/status`, method: "PATCH", body: { status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] })
  });

  const renameMutation = useMutation({
    mutationFn: ({ uid, username }: { uid: string; username: string }) =>
      fetchJSON({ url: `/api/users/${uid}/rename`, method: "PATCH", body: { username } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] })
  });

  const deleteMutation = useMutation({
    mutationFn: (uid: string) => fetchJSON({ url: `/api/users?uid=${uid}`, method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] })
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const username = String(form.get("username"));
    const password = String(form.get("password"));
    const role = (form.get("role") as "admin" | "user") || "user";
    createMutation.mutate({ email, username, password, role });
    event.currentTarget.reset();
  };

  return (
    <div className="space-y-8">
      <Card>
        <h1 className="text-2xl font-semibold text-white">Create user</h1>
        <form onSubmit={handleCreate} className="mt-6 grid gap-4 md:grid-cols-2">
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="username" placeholder="Username" required />
          <Input name="password" type="password" placeholder="Temporary password" required />
          <select name="role" className="rounded-2xl bg-white/5 px-4 py-2 text-sm">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <div className="md:col-span-2">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create user"}
            </Button>
          </div>
          {createMutation.error && (
            <p className="md:col-span-2 text-sm text-rose-400">{String((createMutation.error as Error).message)}</p>
          )}
        </form>
      </Card>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Users</h2>
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.uid} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-white">{user.username}</p>
                  <p className="text-sm text-white/60">{user.email}</p>
                  <p className="text-xs uppercase tracking-wide text-white/40">{user.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      statusMutation.mutate({ uid: user.uid, status: user.status === "active" ? "inactive" : "active" })
                    }
                  >
                    {user.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="ghost" onClick={() => deleteMutation.mutate(user.uid)}>
                    Delete
                  </Button>
                </div>
              </div>
              <RenameInline
                onRename={(username) => renameMutation.mutate({ uid: user.uid, username })}
                defaultValue={user.username}
              />
            </Card>
          ))}
          {users.length === 0 && <Card>No users yet.</Card>}
        </div>
      </div>
    </div>
  );
}

function RenameInline({ defaultValue, onRename }: { defaultValue: string; onRename: (value: string) => void }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <form
      className="flex items-center gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onRename(value);
      }}
    >
      <Input value={value} onChange={(e) => setValue(e.target.value)} />
      <Button type="submit" variant="outline">
        Rename
      </Button>
    </form>
  );
}
