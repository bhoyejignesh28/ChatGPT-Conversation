"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Placeholder, RenderOverride } from "@/lib/types";
import { useFontLoader } from "@/lib/useFontLoader";

interface CanvasRendererProps {
  width: number;
  height: number;
  placeholders: (Placeholder & { hidden?: boolean })[];
  overrides?: Record<string, RenderOverride & { value?: string; hidden?: boolean }>;
  baseImageUrl?: string | null;
  scale?: number;
  activeId?: string | null;
  onPositionChange?: (id: string, update: { x: number; y: number }) => void;
  valueResolver?: (placeholder: Placeholder) => string | undefined;
  logoImage?: string | null;
  exposeCanvas?: (canvas: HTMLCanvasElement | null) => void;
}

export function CanvasRenderer({
  width,
  height,
  placeholders,
  overrides = {},
  baseImageUrl,
  scale = 0.33,
  activeId,
  onPositionChange,
  valueResolver,
  logoImage,
  exposeCanvas
}: CanvasRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(
    null
  );

  useEffect(() => {
    if (exposeCanvas) exposeCanvas(canvasRef.current);
  }, [exposeCanvas]);

  const fontRequests = useMemo(() => {
    const unique = new Map<string, { family: string; weights?: number[]; italic?: boolean }>();
    for (const placeholder of placeholders) {
      const override = overrides[placeholder.id];
      const family = override?.fontFamily || placeholder.fontFamily;
      if (family) {
        const key = `${family}-${override?.italic || placeholder.italic ? "i" : "n"}`;
        const weight = override?.fontWeight || placeholder.fontWeight || 400;
        unique.set(key, { family, weights: [weight], italic: override?.italic ?? placeholder.italic });
      }
    }
    return Array.from(unique.values());
  }, [placeholders, overrides]);

  useFontLoader(fontRequests);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    const draw = () => {
      placeholders.forEach((placeholder) => {
        const override = overrides[placeholder.id];
        if (placeholder.hidden || override?.hidden) return;
        ctx.save();
        if (placeholder.type === "text") {
          const fontFamily = override?.fontFamily || placeholder.fontFamily || "Inter";
          const fontSize = override?.fontSize || placeholder.fontSize || 32;
          const weight = override?.fontWeight || placeholder.fontWeight || 600;
          const italic = override?.italic || placeholder.italic ? "italic " : "";
          const align = override?.textAlign || placeholder.textAlign || "left";
          const color = override?.color || placeholder.color || "#ffffff";
          const value = override?.value || valueResolver?.(placeholder) || placeholder.key.toUpperCase();
          ctx.font = `${italic}${weight} ${fontSize}px "${fontFamily}", sans-serif`;
          ctx.fillStyle = color;
          ctx.textAlign = align as CanvasTextAlign;
          const lines = value.split("\n");
          const lineHeight = fontSize * 1.2;
          lines.forEach((line, index) => {
            let x = placeholder.x;
            if (align === "center") x += placeholder.w / 2;
            if (align === "right") x += placeholder.w;
            const y = placeholder.y + fontSize + index * lineHeight;
            ctx.fillText(line, x, y, placeholder.w);
          });
        } else if (placeholder.type === "logo" && logoImage) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = logoImage;
          img.onload = () => ctx.drawImage(img, placeholder.x, placeholder.y, placeholder.w, placeholder.h);
        } else {
          ctx.strokeStyle = "rgba(255,255,255,0.3)";
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(placeholder.x, placeholder.y, placeholder.w, placeholder.h);
        }
        ctx.restore();
      });
    };

    if (baseImageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = baseImageUrl;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        draw();
      };
      img.onerror = draw;
    } else {
      draw();
    }
  }, [baseImageUrl, height, overrides, placeholders, valueResolver, width, logoImage]);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      if (!dragging || !onPositionChange) return;
      const scaleFactor = scale;
      const deltaX = event.clientX - dragging.startX;
      const deltaY = event.clientY - dragging.startY;
      const newX = dragging.origX + deltaX / scaleFactor;
      const newY = dragging.origY + deltaY / scaleFactor;
      onPositionChange(dragging.id, { x: Math.max(0, newX), y: Math.max(0, newY) });
    };
    const endDrag = () => setDragging(null);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", endDrag);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", endDrag);
    };
  }, [dragging, onPositionChange, scale]);

  const displayWidth = width * scale;
  const displayHeight = height * scale;

  return (
    <div className="relative flex flex-col items-center gap-4">
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4">
        <div className="mb-2 text-center text-xs text-white/60">Preview @{Math.round(scale * 100)}%</div>
        <div className="relative" style={{ width: displayWidth, height: displayHeight }}>
          <canvas ref={canvasRef} style={{ width: displayWidth, height: displayHeight }} />
          <div className="absolute inset-0">
            {placeholders.map((placeholder) => (
              <div
                key={placeholder.id}
                className={`absolute cursor-move rounded-lg border border-transparent ${
                  activeId === placeholder.id ? "border-primary" : "border-white/10"
                }`}
                style={{
                  left: placeholder.x * scale,
                  top: placeholder.y * scale,
                  width: placeholder.w * scale,
                  height: placeholder.h * scale,
                  opacity: placeholder.hidden || overrides[placeholder.id]?.hidden ? 0.3 : 1
                }}
                onPointerDown={(event) => {
                  if (!onPositionChange) return;
                  setDragging({
                    id: placeholder.id,
                    startX: event.clientX,
                    startY: event.clientY,
                    origX: placeholder.x,
                    origY: placeholder.y
                  });
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        className="rounded-full bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-white/60"
        onClick={() => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const link = document.createElement("a");
          link.href = canvas.toDataURL("image/png");
          link.download = "filingscenter-preview.png";
          link.click();
        }}
      >
        Export preview PNG
      </button>
    </div>
  );
}
