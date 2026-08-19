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
      const s = 30 + (si * 70) / (SAT_COUNT - 1);
      for (let li = 0; li < LIGHT_COUNT; li += 1) {
        const l = 25 + (li * 45) / (LIGHT_COUNT - 1);
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

export type CoachColorFamilyId = 'warm' | 'cool' | 'vivid' | 'pastel' | 'dark' | 'proday';

/** Supprime les doublons hex dans une palette famille (ordre conservé). */
export function dedupeCoachFamilyColors(colors: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const color of colors) {
    const hex = normalizeCoachHexColor(color) ?? color.toUpperCase();
    if (seen.has(hex)) continue;
    seen.add(hex);
    result.push(hex);
  }
  return result;
}

/** Palettes curatoriales pour l'assistant couleur (~18–24 teintes par famille). */
const COACH_COLOR_FAMILIES_RAW: { id: CoachColorFamilyId; colors: string[] }[] = [
  {
    id: 'warm',
    colors: [
      '#E53935',
      '#FF5722',
      '#FF6B35',
      '#FB8C00',
      '#FF9800',
      '#F57C00',
      '#E65100',
      '#D84315',
      '#C62828',
      '#B71C1C',
      '#FF7043',
      '#FF8A65',
      '#FFAB40',
      '#FFC107',
      '#FFB300',
      '#FF6F00',
      '#BF360C',
      '#880E4F',
      '#AD1457',
      '#E91E63',
      '#FF5252',
      '#FF1744',
      '#FF4081',
      '#F50057',
    ],
  },
  {
    id: 'cool',
    colors: [
      '#006CFC',
      '#1E88E5',
      '#2196F3',
      '#42A5F5',
      '#64B5F6',
      '#0D47A1',
      '#1565C0',
      '#1976D2',
      '#0288D1',
      '#0097A7',
      '#00838F',
      '#00695C',
      '#26A69A',
      '#4DD0E1',
      '#00BCD4',
      '#00ACC1',
      '#0091EA',
      '#2962FF',
      '#304FFE',
      '#3F51B5',
      '#5C6BC0',
      '#7E57C2',
      '#32ADE6',
      '#64D2FF',
    ],
  },
  {
    id: 'vivid',
    colors: [
      '#FF375F',
      '#FF6B35',
      '#FFD60A',
      '#00C896',
      '#BF5AF2',
      '#FF9F0A',
      '#30D158',
      '#FF1744',
      '#00E676',
      '#651FFF',
      '#FF9100',
      '#76FF03',
      '#D500F9',
      '#00B0FF',
      '#FF3D00',
      '#C6FF00',
      '#AA00FF',
      '#00BFA5',
      '#FF4081',
      '#536DFE',
      '#FFEA00',
      '#1DE9B6',
      '#F50057',
      '#2979FF',
    ],
  },
  {
    id: 'pastel',
    colors: [
      '#FFCDD2',
      '#F8BBD0',
      '#E1BEE7',
      '#D1C4E9',
      '#C5CAE9',
      '#BBDEFB',
      '#B3E5FC',
      '#B2EBF2',
      '#B2DFDB',
      '#C8E6C9',
      '#DCEDC8',
      '#F0F4C3',
      '#FFF9C4',
      '#FFECB3',
      '#FFE0B2',
      '#FFCCBC',
      '#D7CCC8',
      '#CFD8DC',
      '#F5F5F5',
      '#ECEFF1',
      '#FFAB91',
      '#CE93D8',
      '#90CAF9',
      '#A5D6A7',
    ],
  },
  {
    id: 'dark',
    colors: [
      '#212121',
      '#263238',
      '#37474F',
      '#455A64',
      '#546E7A',
      '#1A237E',
      '#311B92',
      '#4A148C',
      '#880E4F',
      '#B71C1C',
      '#1B5E20',
      '#004D40',
      '#01579B',
      '#0D47A1',
      '#3E2723',
      '#424242',
      '#616161',
      '#1C1C1E',
      '#2C2C2E',
      '#3A3A3C',
      '#48484A',
      '#5D4037',
      '#33691E',
      '#00332A',
    ],
  },
  {
    id: 'proday',
    colors: [
      '#006CFC',
      '#0056CC',
      '#007AFF',
      '#32ADE6',
      '#64D2FF',
      '#5AC8FA',
      '#0A84FF',
      '#1E88E5',
      '#2196F3',
      '#1565C0',
      '#1976D2',
      '#0288D1',
      '#0091EA',
      '#2962FF',
      '#304FFE',
      '#448AFF',
      '#536DFE',
      '#004BA0',
      '#003D82',
      '#0077ED',
      '#3399FF',
      '#66B2FF',
      '#99CCFF',
      '#BBDEFB',
    ],
  },
];

export const COACH_COLOR_FAMILIES = COACH_COLOR_FAMILIES_RAW.map((family) => ({
  id: family.id,
  colors: dedupeCoachFamilyColors(family.colors),
}));

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
