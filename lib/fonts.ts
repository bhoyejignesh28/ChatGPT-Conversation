export const FONT_GROUPS = {
  sans: {
    label: "Sans",
    families: ["Inter", "Poppins", "Roboto", "Montserrat", "Lato", "Open Sans"]
  },
  serif: {
    label: "Serif",
    families: ["Merriweather", "Playfair Display", "Lora", "Noto Serif", "Cormorant Garamond"]
  },
  script: {
    label: "Script",
    families: ["Dancing Script", "Pacifico", "Great Vibes", "Lobster"]
  }
} as const;

export const FONT_WEIGHTS = [400, 500, 600, 700, 800, 900] as const;

export type FontGroupKey = keyof typeof FONT_GROUPS;
