import { ensureFontLoaded } from './fonts.js';

const imageCache = new Map();

async function loadImage(url) {
  if (!url) return null;
  if (imageCache.has(url)) return imageCache.get(url);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  const promise = new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
  img.src = url;
  imageCache.set(url, promise);
  return promise;
}

function resolvePlaceholderValue(placeholder, overrides, profile) {
  const override = overrides?.[placeholder.id] || {};
  if (placeholder.type === 'text') {
    if (override.value != null && override.value !== '') return String(override.value);
    if (profile && placeholder.key && profile[placeholder.key] != null) {
      return String(profile[placeholder.key]);
    }
    return placeholder.key ? placeholder.key.toUpperCase() : placeholder.name || '';
  }
  if (placeholder.type === 'logo') {
    return override.logoUrl || profile?.logoUrl || null;
  }
  return '';
}

function mergePlaceholder(placeholder, overrides, profile) {
  const override = overrides?.[placeholder.id] || {};
  const merged = { ...placeholder, ...override };
  if (placeholder.type === 'text') {
    merged.value = resolvePlaceholderValue(placeholder, overrides, profile);
  } else if (placeholder.type === 'logo') {
    merged.logoUrl = resolvePlaceholderValue(placeholder, overrides, profile);
    merged.scale = override.scale ?? 1;
  }
  return merged;
}

async function render(canvas, template, options = {}) {
  const {
    overrides = {},
    profile = {},
    scale = 1,
    dimensions,
    background = '#ffffff'
  } = options;
  const width = dimensions?.w || template.width || 1200;
  const height = dimensions?.h || template.height || 800;
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  if (template.baseImageUrl) {
    try {
      const img = await loadImage(template.baseImageUrl);
      if (img) ctx.drawImage(img, 0, 0, width, height);
    } catch (err) {
      console.warn('Base image missing', err);
    }
  }

  for (const placeholder of template.placeholders || []) {
    const merged = mergePlaceholder(placeholder, overrides, profile);
    if (merged.type === 'text') {
      await ensureFontLoaded({
        fontFamily: merged.fontFamily,
        fontGroup: merged.fontGroup,
        fontWeight: merged.fontWeight,
        italic: merged.italic
      });
      ctx.fillStyle = merged.color || '#000000';
      ctx.textBaseline = 'top';
      ctx.textAlign = merged.textAlign || 'left';
      ctx.font = `${merged.italic ? 'italic ' : ''}${merged.fontWeight || 400} ${merged.fontSize || 24}px "${merged.fontFamily}"`;
      const x = merged.x || 0;
      const y = merged.y || 0;
      const w = merged.w || 200;
      const lineHeight = (merged.fontSize || 24) * 1.2;
      wrapText(ctx, merged.value || '', x, y, w, lineHeight, merged.textAlign || 'left');
    } else if (merged.type === 'logo' && merged.logoUrl) {
      try {
        const img = await loadImage(merged.logoUrl);
        if (img) {
          const { x = 0, y = 0, w = img.width, h = img.height } = merged;
          const scaleValue = merged.scale || 1;
          const targetW = w * scaleValue;
          const ratio = img.height / img.width;
          const targetH = targetW * ratio;
          ctx.drawImage(img, x, y, targetW, targetH);
        }
      } catch (err) {
        console.warn('Logo load failed', err);
      }
    }
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, align) {
  if (!text) return;
  const words = text.split(/\s+/);
  let line = '';
  let offsetY = y;
  const lines = [];
  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    const { width } = ctx.measureText(testLine);
    if (width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });
  if (line) lines.push(line);
  lines.forEach((ln) => {
    let drawX = x;
    if (align === 'center') drawX = x + maxWidth / 2;
    if (align === 'right') drawX = x + maxWidth;
    ctx.fillText(ln, drawX, offsetY);
    offsetY += lineHeight;
  });
}

export async function drawPreview(canvas, template, options = {}) {
  const scale = options.scale ?? 0.25;
  await render(canvas, template, { ...options, scale });
}

export async function exportPNG(template, options = {}) {
  const offscreen = document.createElement('canvas');
  await render(offscreen, template, { ...options, scale: 1 });
  return new Promise((resolve) => {
    offscreen.toBlob((blob) => resolve({ blob, width: offscreen.width, height: offscreen.height }), 'image/png');
  });
}

