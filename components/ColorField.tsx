"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorField({ label, value, onChange }: ColorFieldProps) {
  const [hex, setHex] = useState(value || "#ffffff");

  useEffect(() => {
    if (value && value !== hex) setHex(value);
  }, [value]);

  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wide text-white/70">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={hex}
          onChange={(e) => {
            setHex(e.target.value);
            onChange(e.target.value);
          }}
          className="h-10 w-10 cursor-pointer rounded-full border border-white/10 bg-transparent"
        />
        <Input
          value={hex}
          onChange={(e) => {
            const val = e.target.value;
            setHex(val);
            if (/^#[0-9a-fA-F]{6}$/.test(val)) {
              onChange(val);
            }
          }}
        />
      </div>
    </div>
  );
}
