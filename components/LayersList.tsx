"use client";

import { Placeholder } from "@/lib/types";
import { Eye, EyeOff } from "lucide-react";

interface LayersListProps {
  layers: (Placeholder & { hidden?: boolean })[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}

export function LayersList({ layers, activeId, onSelect, onToggle }: LayersListProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs uppercase tracking-wide text-white/60">Layers</h3>
      <div className="space-y-2">
        {layers.map((layer) => (
          <button
            type="button"
            key={layer.id}
            onClick={() => onSelect(layer.id)}
            className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition ${
              activeId === layer.id ? "bg-primary text-black" : "bg-white/5 text-white"
            }`}
          >
            <span>{layer.type.toUpperCase()}</span>
            <span className="flex items-center gap-2 text-xs uppercase tracking-wide">
              {layer.key}
              <span
                className="rounded-full bg-black/20 p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(layer.id);
                }}
              >
                {layer.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
