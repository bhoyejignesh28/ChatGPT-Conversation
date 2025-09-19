"use client";

import { useTheme } from "next-themes";
import { MoonStar, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme !== "light";
  return (
    <button
      type="button"
      className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 hover:text-white"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun size={16} /> : <MoonStar size={16} />}
    </button>
  );
}
