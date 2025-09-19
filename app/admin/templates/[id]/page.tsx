"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueries } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { fetchJSON } from "@/lib/fetch";
import { Placeholder, Template } from "@/lib/types";
import { CanvasRenderer } from "@/components/CanvasRenderer";
import { LeftPanel } from "@/components/LeftPanel";
import { FontPicker } from "@/components/FontPicker";
import { ColorField } from "@/components/ColorField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface EditablePlaceholder extends Placeholder {
  hidden?: boolean;
  baseW: number;
  baseH: number;
}

export default function AdminTemplateEditor() {
  const params = useParams<{ id: string }>();
  const templateId = params.id;

  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  const [templateQuery, sizesQuery] = useQueries({
    queries: [
      { queryKey: ["template", templateId], queryFn: () => fetchJSON<{ template: Template }>({ url: `/api/templates?id=${templateId}` }) },
      { queryKey: ["sizes"], queryFn: () => fetchJSON<{ sizes: any[] }>({ url: "/api/sizes" }) }
    ]
  });

  const template = templateQuery.data?.template;
  const size = sizesQuery.data?.sizes.find((s) => s.id === template?.sizeId) || { w: 1200, h: 1600 };

  const [placeholders, setPlaceholders] = useState<EditablePlaceholder[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!template) return;
    setPlaceholders(
      template.placeholders.map((placeholder) => ({
        ...placeholder,
        baseW: placeholder.w,
        baseH: placeholder.h
      }))
    );
    setActiveId(template.placeholders[0]?.id ?? null);
  }, [template]);

  const saveMutation = useMutation({
    mutationFn: () =>
      fetchJSON({
        url: `/api/templates?id=${templateId}`,
        method: "PATCH",
        body: {
          name: template?.name,
          placeholders: placeholders.map(({ baseW, baseH, hidden, ...rest }) => rest)
        }
      }),
    onSuccess: () => templateQuery.refetch()
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const base64 = await toBase64(file);
      return fetchJSON({ url: `/api/templates/${templateId}/base`, method: "POST", body: { image: base64 } });
    },
    onSuccess: () => templateQuery.refetch()
  });

  const addPlaceholder = (type: Placeholder["type"], key: Placeholder["key"]) => {
    const id = crypto.randomUUID();
    setPlaceholders((prev) => [
      ...prev,
      {
        id,
        type,
        key,
        x: 100,
        y: 100,
        w: 300,
        h: 120,
        fontGroup: "sans",
        fontFamily: "Inter",
        fontWeight: 600,
        fontSize: 48,
        color: "#ffffff",
        textAlign: "left",
        baseW: 300,
        baseH: 120
      }
    ]);
    setActiveId(id);
  };

  const updatePlaceholder = (id: string, update: Partial<EditablePlaceholder>) => {
    setPlaceholders((prev) =>
      prev.map((placeholder) =>
        placeholder.id === id
          ? {
              ...placeholder,
              ...update
            }
          : placeholder
      )
    );
  };

  const deletePlaceholder = (id: string) => {
    setPlaceholders((prev) => {
      const next = prev.filter((placeholder) => placeholder.id !== id);
      if (activeId === id) {
        setActiveId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const handlePositionChange = (id: string, update: { x: number; y: number }) => {
    updatePlaceholder(id, update);
  };

  const activePlaceholder = placeholders.find((p) => p.id === activeId);

  const renderControls = () => {
    if (!activePlaceholder) return <p className="text-white/60">Select a layer to edit.</p>;
    return (
      <div className="space-y-5">
        <div className="flex justify-between text-sm text-white/60">
          <span>{activePlaceholder.type.toUpperCase()}</span>
          <button className="text-rose-300" type="button" onClick={() => deletePlaceholder(activePlaceholder.id)}>
            Delete
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(["x", "y", "w", "h"] as const).map((field) => (
            <div key={field}>
              <label className="text-xs uppercase tracking-wide text-white/60">{field.toUpperCase()}</label>
              <Input
                type="number"
                value={activePlaceholder[field]}
                onChange={(e) => updatePlaceholder(activePlaceholder.id, { [field]: Number(e.target.value) } as any)}
              />
            </div>
          ))}
        </div>
        {activePlaceholder.type === "text" && (
          <>
            <FontPicker
              group={(activePlaceholder.fontGroup as any) || "sans"}
              family={activePlaceholder.fontFamily}
              weight={activePlaceholder.fontWeight}
              italic={activePlaceholder.italic ?? false}
              onChange={({ group, family, weight, italic }) =>
                updatePlaceholder(activePlaceholder.id, {
                  fontGroup: group,
                  fontFamily: family,
                  fontWeight: weight,
                  italic
                })
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wide text-white/60">Font size</label>
                <Input
                  type="number"
                  value={activePlaceholder.fontSize || 32}
                  onChange={(e) => updatePlaceholder(activePlaceholder.id, { fontSize: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-white/60">Align</label>
                <div className="flex gap-2">
                  {["left", "center", "right"].map((align) => (
                    <button
                      key={align}
                      type="button"
                      className={`rounded-xl px-3 py-2 text-xs uppercase ${
                        (activePlaceholder.textAlign || "left") === align ? "bg-primary text-black" : "bg-white/10"
                      }`}
                      onClick={() => updatePlaceholder(activePlaceholder.id, { textAlign: align as any })}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <ColorField
              label="Color"
              value={activePlaceholder.color || "#ffffff"}
              onChange={(color) => updatePlaceholder(activePlaceholder.id, { color })}
            />
          </>
        )}
      </div>
    );
  };

  if (!template) {
    return <div className="text-white/60">Loading template…</div>;
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
      <LeftPanel
        title={template.name}
        layers={placeholders}
        activeId={activeId}
        onSelect={setActiveId}
        onToggle={(id) => updatePlaceholder(id, { hidden: !placeholders.find((p) => p.id === id)?.hidden })}
      >
        {renderControls()}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => addPlaceholder("text", "custom")}>
            Add text
          </Button>
          <Button variant="outline" onClick={() => addPlaceholder("logo", "logo")}>
            Add logo
          </Button>
          <Button variant="outline" onClick={() => addPlaceholder("icon", "icon:phone")}>
            Add icon
          </Button>
        </div>
        <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving…" : "Save template"}
        </Button>
        <label className="flex cursor-pointer flex-col gap-2 text-sm text-white/70">
          <span>Base image</span>
          <input
            type="file"
            accept="image/png,image/jpeg"
            className="rounded-2xl bg-white/5 px-4 py-2"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadMutation.mutate(file);
            }}
          />
        </label>
      </LeftPanel>
      <div className="flex flex-col items-center gap-6">
        <CanvasRenderer
          width={size.w}
          height={size.h}
          placeholders={placeholders}
          overrides={{}}
          baseImageUrl={template.baseImageUrl}
          activeId={activeId}
          onPositionChange={handlePositionChange}
          exposeCanvas={setCanvas}
          scale={0.33}
        />
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
          Drag layers on the canvas to reposition.
        </div>
      </div>
    </div>
  );
}

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
