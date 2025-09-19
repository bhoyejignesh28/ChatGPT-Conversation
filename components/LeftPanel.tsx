import { ReactNode } from "react";
import { LayersList } from "@/components/LayersList";
import { Placeholder } from "@/lib/types";

interface LeftPanelProps {
  layers: (Placeholder & { hidden?: boolean })[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  children: ReactNode;
  title: string;
}

export function LeftPanel({ layers, activeId, onSelect, onToggle, children, title }: LeftPanelProps) {
  return (
    <aside className="sticky top-20 h-[calc(100vh-5rem)] w-80 overflow-y-auto rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-white/70">Configure layers and styles.</p>
        </div>
        <LayersList layers={layers} activeId={activeId} onSelect={onSelect} onToggle={onToggle} />
        <div className="space-y-4">{children}</div>
      </div>
    </aside>
  );
}
