"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJSON } from "@/lib/fetch";
import { updateProfile } from "@/lib/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

async function uploadLogo(file: File) {
  const base64 = await toBase64(file);
  return fetchJSON<{ logoUrl: string }>({ url: "/api/uploads/logo", method: "POST", body: { image: base64 } });
}

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["profile"], queryFn: () => fetchJSON<{ profile: any }>({ url: "/api/profile" }) });
  const profile = data?.profile || { name: "", phone: "", email: "", address: "", logoUrl: null };
  const [formState, setFormState] = useState(profile);

  useEffect(() => {
    setFormState(profile);
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: (payload: typeof profile) => updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
  });

  const logoMutation = useMutation({
    mutationFn: uploadLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMutation.mutate(formState);
  };

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_320px]">
      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div>
          <h1 className="text-3xl font-semibold text-white">Profile</h1>
          <p className="mt-2 text-sm text-white/70">These details pre-fill placeholders when you open a template.</p>
        </div>
        {[
          { name: "name", label: "Display name" },
          { name: "phone", label: "Phone" },
          { name: "email", label: "Email" },
          { name: "address", label: "Address" }
        ].map((field) => (
          <div key={field.name} className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-white/60">{field.label}</label>
            <Input
              value={formState[field.name as keyof typeof formState] ?? ""}
              onChange={(e) => setFormState((prev: any) => ({ ...prev, [field.name]: e.target.value }))}
              type={field.name === "email" ? "email" : "text"}
            />
          </div>
        ))}
        <Button type="submit" className="px-6 py-3" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving…" : "Save profile"}
        </Button>
      </form>
      <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-lg font-semibold text-white">Logo</h2>
        <p className="text-sm text-white/70">Upload a transparent PNG up to 5MB. It becomes available in logo placeholders.</p>
        <div className="rounded-2xl border border-dashed border-white/20 bg-black/20 p-6 text-center">
          {profile.logoUrl ? (
            <img src={profile.logoUrl} alt="Logo" className="mx-auto h-32 object-contain" />
          ) : (
            <p className="text-white/60">No logo uploaded</p>
          )}
        </div>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-6 text-sm text-white/70 hover:text-white">
          <input
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                logoMutation.mutate(file);
              }
            }}
          />
          {logoMutation.isPending ? "Uploading…" : "Upload new logo"}
        </label>
      </div>
    </div>
  );
}
