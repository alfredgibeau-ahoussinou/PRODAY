function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/** Valide et normalise un hex coach (#RRGGBB). */
export function normalizeCoachHexColor(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(/^#?([0-9A-Fa-f]{6})$/);
  if (!match) return null;
  return `#${match[1].toUpperCase()}`;
}

const HUE_COUNT = 24;
const SAT_COUNT = 8;
const LIGHT_COUNT = 10;

/** Grille HSL — 24 teintes × 8 sat × 10 luminosité (≈1920 couleurs). */
export function buildCoachColorGrid(): string[] {
  const colors: string[] = [];
  const seen = new Set<string>();

  for (let hi = 0; hi < HUE_COUNT; hi += 1) {
    const h = Math.round((hi * 360) / HUE_COUNT) % 360;
    for (let si = 0; si < SAT_COUNT; si += 1) {
      const s = SAT_COUNT === 1 ? 65 : 30 + (si * 70) / (SAT_COUNT - 1);
      for (let li = 0; li < LIGHT_COUNT; li += 1) {
        const l = LIGHT_COUNT === 1 ? 45 : 25 + (li * 45) / (LIGHT_COUNT - 1);
        const hex = normalizeCoachHexColor(hslToHex(h, s, l));
        if (hex && !seen.has(hex)) {
          seen.add(hex);
          colors.push(hex);
        }
      }
    }
  }

  return colors;
}

export const COACH_COLOR_GRID = buildCoachColorGrid();
export const COACH_COLOR_GRID_SIZE = COACH_COLOR_GRID.length;

const COACH_NAMED_COLORS: Record<string, { hex: string; label: string }> = {
  rouge: { hex: '#E53935', label: 'Rouge' },
  bleu: { hex: '#1E88E5', label: 'Bleu' },
  'bleu marine': { hex: '#0D47A1', label: 'Bleu marine' },
  marine: { hex: '#0D47A1', label: 'Bleu marine' },
  vert: { hex: '#43A047', label: 'Vert' },
  orange: { hex: '#FB8C00', label: 'Orange' },
  violet: { hex: '#8E24AA', label: 'Violet' },
  rose: { hex: '#EC407A', label: 'Rose' },
  jaune: { hex: '#FDD835', label: 'Jaune' },
  noir: { hex: '#212121', label: 'Noir' },
  blanc: { hex: '#FAFAFA', label: 'Blanc' },
  gris: { hex: '#757575', label: 'Gris' },
  bordeaux: { hex: '#880E4F', label: 'Bordeaux' },
  turquoise: { hex: '#26A69A', label: 'Turquoise' },
  proday: { hex: '#006CFC', label: 'Bleu ProDay' },
  'bleu proday': { hex: '#006CFC', label: 'Bleu ProDay' },
};

const NAMED_COLOR_KEYS = Object.keys(COACH_NAMED_COLORS).sort((a, b) => b.length - a.length);

/** Parse une phrase ou un code couleur coach (hex, noms FR, alias ProDay). */
export function parseCoachColorPhrase(text: string): { hex: string; label: string } | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const hex = normalizeCoachHexColor(trimmed);
  if (hex) return { hex, label: hex };

  const normalized = trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

  for (const key of NAMED_COLOR_KEYS) {
    if (normalized === key) return COACH_NAMED_COLORS[key];
  }

  return null;
}
