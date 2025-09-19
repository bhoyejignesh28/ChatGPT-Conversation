"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueries } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { fetchJSON } from "@/lib/fetch";
import { Placeholder, RenderOverride, Template } from "@/lib/types";
import { CanvasRenderer } from "@/components/CanvasRenderer";
import { LeftPanel } from "@/components/LeftPanel";
import { ColorField } from "@/components/ColorField";
import { FontPicker } from "@/components/FontPicker";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FONT_GROUPS } from "@/lib/fonts";

interface EditorPlaceholder extends Placeholder {
  hidden?: boolean;
  baseW: number;
  baseH: number;
}

type OverridesMap = Record<string, RenderOverride & { value?: string; hidden?: boolean; fontGroup?: string }>;

export default function TemplateEditorPage() {
  const params = useParams<{ templateId: string }>();
  const templateId = params.templateId;

  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  const [templateQuery, profileQuery, sizesQuery] = useQueries({
    queries: [
      {
        queryKey: ["template", templateId],
        queryFn: () => fetchJSON<{ template: Template }>({ url: `/api/templates?id=${templateId}` })
      },
      {
        queryKey: ["profile"],
        queryFn: () => fetchJSON<{ profile: any }>({ url: "/api/profile" })
      },
      {
        queryKey: ["sizes"],
        queryFn: () => fetchJSON<{ sizes: { id: string; w: number; h: number; name: string }[] }>({ url: "/api/sizes" })
      }
    ]
  });

  const template = templateQuery.data?.template;
  const profile = profileQuery.data?.profile || { name: "", phone: "", email: "", address: "", logoUrl: null };
  const size = sizesQuery.data?.sizes.find((s) => s.id === template?.sizeId) || { w: 1200, h: 1600, name: "Custom" };

  const [placeholders, setPlaceholders] = useState<EditorPlaceholder[]>([]);
  const [overrides, setOverrides] = useState<OverridesMap>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!template) return;
    setPlaceholders(
      template.placeholders.map((placeholder) => ({
        ...placeholder,
        hidden: false,
        baseW: placeholder.w,
        baseH: placeholder.h
      }))
    );
    setOverrides({});
    setActiveId(template.placeholders[0]?.id ?? null);
  }, [template]);

  const valueResolver = (placeholder: Placeholder) => {
    const override = overrides[placeholder.id];
    if (override?.value) return override.value;
    switch (placeholder.key) {
      case "name":
        return profile.name;
      case "phone":
        return profile.phone;
      case "email":
        return profile.email;
      case "address":
        return profile.address;
      default:
        return "";
    }
  };

  const updateOverride = (id: string, update: Partial<RenderOverride & { value?: string; hidden?: boolean; fontGroup?: string }>) => {
    setOverrides((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...update
      }
    }));
  };

  const toggleLayer = (id: string) => {
    setPlaceholders((prev) =>
      prev.map((layer) =>
        layer.id === id
          ? {
              ...layer,
              hidden: !layer.hidden
            }
          : layer
      )
    );
  };

  const handlePositionChange = (id: string, update: { x: number; y: number }) => {
    setPlaceholders((prev) => {
      const next = prev.map((placeholder) =>
        placeholder.id === id
          ? {
              ...placeholder,
              x: update.x,
              y: update.y
            }
          : placeholder
      );
      const moved = next.find((p) => p.id === id);
      if (moved?.type === "logo") {
        updateOverride(id, { logoX: moved.x, logoY: moved.y });
      }
      return next;
    });
  };

  const activePlaceholder = placeholders.find((p) => p.id === activeId);

  const exportMutation = useMutation({
    mutationFn: async () => {
      if (!canvas || !template) throw new Error("Canvas not ready");
      const image = canvas.toDataURL("image/png");
      const payload = {
        templateId: template.id,
        overrides: overrides,
        image
      };
      return fetchJSON({ url: "/api/renders", method: "POST", body: payload });
    }
  });

  const renderControls = () => {
    if (!activePlaceholder) return <p className="text-white/60">Select a layer to edit.</p>;
    if (activePlaceholder.type === "text") {
      const override = overrides[activePlaceholder.id] || {};
      const value = override.value ?? valueResolver(activePlaceholder) ?? "";
      const fontGroup = (override.fontGroup as keyof typeof FONT_GROUPS) || activePlaceholder.fontGroup || "sans";
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-white/60">Text</label>
            <textarea
              className="w-full rounded-2xl bg-white/5 p-3 text-sm text-white"
              rows={4}
              value={value}
              onChange={(e) => updateOverride(activePlaceholder.id, { value: e.target.value })}
            />
          </div>
          <FontPicker
            group={fontGroup}
            family={override.fontFamily || activePlaceholder.fontFamily}
            weight={override.fontWeight || activePlaceholder.fontWeight}
            italic={override.italic ?? activePlaceholder.italic ?? false}
            onChange={({ group, family, weight, italic }) =>
              updateOverride(activePlaceholder.id, {
                fontGroup: group,
                fontFamily: family,
                fontWeight: weight,
                italic
              })
            }
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-white/60">Font size</label>
              <Input
                type="number"
                value={override.fontSize || activePlaceholder.fontSize || 32}
                onChange={(e) => updateOverride(activePlaceholder.id, { fontSize: Number(e.target.value) })}
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
                      (override.textAlign || activePlaceholder.textAlign || "left") === align ? "bg-primary text-black" : "bg-white/10"
                    }`}
                    onClick={() => updateOverride(activePlaceholder.id, { textAlign: align as any })}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <ColorField
            label="Color"
            value={override.color || activePlaceholder.color || "#ffffff"}
            onChange={(value) => updateOverride(activePlaceholder.id, { color: value })}
          />
        </div>
      );
    }

    if (activePlaceholder.type === "logo") {
      const override = overrides[activePlaceholder.id] || {};
      const scale = override.logoScale || 1;
      return (
        <div className="space-y-6">
          <p className="text-sm text-white/70">Drag the logo on the canvas to reposition. Use the slider to scale proportionally.</p>
          <label className="text-xs uppercase tracking-wide text-white/60">Scale</label>
          <input
            type="range"
            min={0.2}
            max={2}
            step={0.05}
            value={scale}
            onChange={(e) => {
              const factor = Number(e.target.value);
              setPlaceholders((prev) =>
                prev.map((placeholder) =>
                  placeholder.id === activePlaceholder.id
                    ? {
                        ...placeholder,
                        w: placeholder.baseW * factor,
                        h: placeholder.baseH * factor
                      }
                    : placeholder
                )
              );
              updateOverride(activePlaceholder.id, { logoScale: factor });
            }}
          />
        </div>
      );
    }

    return <p className="text-white/60">Icon layers inherit styling from the template.</p>;
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
        onToggle={toggleLayer}
      >
        {renderControls()}
        <Button
          className="w-full"
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
        >
          {exportMutation.isPending ? "Saving…" : "Export & Save"}
        </Button>
        {exportMutation.error && <p className="text-sm text-rose-400">{String((exportMutation.error as Error).message)}</p>}
      </LeftPanel>
      <div className="flex flex-col items-center gap-6">
        <CanvasRenderer
          width={size.w}
          height={size.h}
          placeholders={placeholders}
          overrides={overrides}
          baseImageUrl={template.baseImageUrl}
          activeId={activeId}
          onPositionChange={handlePositionChange}
          valueResolver={valueResolver}
          logoImage={profile.logoUrl || null}
          exposeCanvas={setCanvas}
          scale={0.33}
        />
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
          Size: {size.name} ({size.w}×{size.h})
        </div>
      </div>
    </div>
  );
}
