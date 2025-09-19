const FONT_LIBRARY = {
  sans: {
    Inter: [400, 500, 600, 700, 800, 900],
    Poppins: [400, 500, 600, 700, 800, 900],
    Roboto: [400, 500, 700, 900],
    Montserrat: [400, 500, 600, 700, 800, 900],
    Lato: [400, 700, 900],
    'Open Sans': [400, 600, 700, 800]
  },
  serif: {
    Merriweather: [400, 700, 900],
    'Playfair Display': [400, 500, 600, 700, 800, 900],
    Lora: [400, 500, 600, 700],
    'Noto Serif': [400, 500, 600, 700],
    'Cormorant Garamond': [400, 500, 600, 700]
  },
  script: {
    'Dancing Script': [400, 500, 600, 700],
    Pacifico: [400],
    'Great Vibes': [400],
    Lobster: [400]
  }
};

const loadedFonts = new Set();

function buildGoogleUrl(family, weights, includeItalic) {
  const familyParam = family.replace(/ /g, '+');
  const segments = [];
  weights.forEach((w) => {
    segments.push(`0,${w}`);
    if (includeItalic) segments.push(`1,${w}`);
  });
  return `https://fonts.googleapis.com/css2?family=${familyParam}:ital,wght@${segments.join(';')}&display=swap`;
}

export function getFontLibrary() {
  return FONT_LIBRARY;
}

export function getFamilies(group) {
  const library = FONT_LIBRARY[group] || {};
  return Object.keys(library);
}

export function getWeights(group, family) {
  const library = FONT_LIBRARY[group] || {};
  return library[family] || [400];
}

export async function ensureFontLoaded({ fontFamily, fontGroup, fontWeight = 400, italic = false }) {
  const weights = getWeights(fontGroup, fontFamily);
  const key = `${fontFamily}-${weights.join(',')}-${italic ? 'i' : 'n'}`;
  if (loadedFonts.has(key)) return;
  const url = buildGoogleUrl(fontFamily, weights, italic);
  if (!document.querySelector(`link[data-font="${key}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.dataset.font = key;
    document.head.appendChild(link);
  }
  try {
    await document.fonts.load(`${italic ? 'italic ' : ''}${fontWeight} 16px "${fontFamily}"`);
    loadedFonts.add(key);
  } catch (err) {
    console.error('Font load failed', err);
  }
}

