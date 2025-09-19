"use client";

import { FONT_GROUPS, FONT_WEIGHTS, FontGroupKey } from "@/lib/fonts";
import { Input } from "@/components/ui/Input";

interface FontPickerProps {
  group?: FontGroupKey;
  family?: string;
  weight?: number;
  italic?: boolean;
  onChange: (value: { group: FontGroupKey; family: string; weight: number; italic: boolean }) => void;
}

export function FontPicker({ group = "sans", family, weight = 400, italic = false, onChange }: FontPickerProps) {
  const selectedGroup = FONT_GROUPS[group] ? group : "sans";
  const families = FONT_GROUPS[selectedGroup].families;
  const currentFamily = family && families.includes(family) ? family : families[0];
  const currentWeight = FONT_WEIGHTS.includes(weight as any) ? weight : 400;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-xs uppercase tracking-wide text-white/70">
        {Object.entries(FONT_GROUPS).map(([key, meta]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange({ group: key as FontGroupKey, family: FONT_GROUPS[key as FontGroupKey].families[0], weight: currentWeight, italic })}
            className={`rounded-xl px-3 py-2 text-xs font-semibold ${selectedGroup === key ? "bg-primary text-black" : "bg-white/5"}`}
          >
            {meta.label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wide text-white/70">Font Family</label>
        <div className="grid grid-cols-2 gap-2">
          {families.map((fam) => (
            <button
              key={fam}
              type="button"
              onClick={() => onChange({ group: selectedGroup, family: fam, weight: currentWeight, italic })}
              className={`rounded-xl px-3 py-2 text-left text-sm ${currentFamily === fam ? "bg-primary text-black" : "bg-white/5"}`}
              style={{ fontFamily: `'${fam}', sans-serif` }}
            >
              {fam}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <select
          className="rounded-2xl bg-white/5 px-3 py-2 text-sm"
          value={currentWeight}
          onChange={(e) => onChange({ group: selectedGroup, family: currentFamily, weight: Number(e.target.value), italic })}
        >
          {FONT_WEIGHTS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={italic}
            onChange={(e) => onChange({ group: selectedGroup, family: currentFamily, weight: currentWeight, italic: e.target.checked })}
          />
          Italic
        </label>
      </div>
    </div>
  );
}
