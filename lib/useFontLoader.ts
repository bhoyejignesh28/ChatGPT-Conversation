"use client";

import { useEffect } from "react";

type FontRequest = { family: string; weights?: number[]; italic?: boolean };

const loaded: Record<string, boolean> = {};

export function useFontLoader(fonts: FontRequest[]) {
  useEffect(() => {
    fonts.forEach((font) => {
      const key = `${font.family}-${(font.weights || []).join("-")}-${font.italic ? "i" : "n"}`;
      if (loaded[key]) return;
      const weights = font.weights && font.weights.length ? `:wght@${font.weights.join(";")}` : "";
      const italicParam = font.italic ? ";1" : "";
      const href = `https://fonts.googleapis.com/css2?family=${font.family.replace(/\s+/g, "+")}${weights}${italicParam}&display=swap`;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
      loaded[key] = true;
    });
  }, [fonts.map((f) => `${f.family}-${(f.weights || []).join("-")}-${f.italic ? "i" : "n"}`).join("|")]);
}
