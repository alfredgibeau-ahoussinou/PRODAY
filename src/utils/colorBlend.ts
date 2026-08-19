import { normalizeCoachHexColor } from './coachColorPicker';

const DEFAULT_BG = '#0A0A0F';

function parseRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeCoachHexColor(hex);
  if (!normalized) return null;
  const raw = normalized.replace('#', '');
  return {
    r: parseInt(raw.slice(0, 2), 16),
    g: parseInt(raw.slice(2, 4), 16),
    b: parseInt(raw.slice(4, 6), 16),
  };
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

/** Mélange deux couleurs hex (ratio = part de b, 0–1). */
export function blendHex(a: string, b: string, ratio = 0.5): string {
  const rgbA = parseRgb(a);
  const rgbB = parseRgb(b);
  if (!rgbA || !rgbB) return normalizeCoachHexColor(a) ?? normalizeCoachHexColor(b) ?? '#FFFFFF';
  const t = Math.max(0, Math.min(1, ratio));
  return toHex(
    rgbA.r * (1 - t) + rgbB.r * t,
    rgbA.g * (1 - t) + rgbB.g * t,
    rgbA.b * (1 - t) + rgbB.b * t,
  );
}

/** Surface sombre lisible teintée par l’accent. */
export function deriveSurface(bg: string, accent: string, ratio = 0.12): string {
  return blendHex(bg, accent, ratio);
}

/** Fond sombre teinté pour un espace « tout en X ». */
export function deriveThemedBackground(accent: string, base = DEFAULT_BG): string {
  return blendHex(base, accent, 0.18);
}
