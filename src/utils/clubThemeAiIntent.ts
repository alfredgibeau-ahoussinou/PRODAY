import {
  findTeamColorPreset,
  type FootballTeamColorPreset,
} from '../content/footballTeamColorPresets';
import { deriveClubSecondaryColor } from './clubBrandColors';
import { normalizeCoachHexColor } from './coachColorPicker';

export type ClubThemeAiColors = {
  primary: string;
  secondary: string;
};

export type ClubThemeAiResult =
  | { ok: true; colors: ClubThemeAiColors; label: string; presetId?: string }
  | { ok: false; message: string };

export const CLUB_THEME_AI_FALLBACK_MESSAGE =
  'Décris un style, un club ou un mélange — le copilote propose une palette, confirmation avant application.';

export const CLUB_THEME_AI_EXAMPLE_CHIPS = [
  'Style Barça',
  'Style Real',
  'Couleurs PSG',
  'Mix bleu et or',
] as const;

export const CLUB_THEME_AI_REMOTE_PROMPT = (phrase: string) =>
  [
    `Propose une palette couleurs club (principale + secondaire) pour : « ${phrase.trim()} ».`,
    'Réponds en français avec exactement deux codes hex (#RRGGBB).',
    'Format obligatoire : PRINCIPALE #xxxxxx · SECONDAIRE #xxxxxx — courte justification.',
    'Ne propose aucune autre action que la palette.',
  ].join(' ');

/**
 * Extrait une palette depuis une réponse copilote (deux hex #RRGGBB).
 */
export function parseClubColorsFromAssistantReply(reply: string): ClubThemeAiResult | null {
  const matches = reply.match(/#?[0-9A-Fa-f]{6}/g) ?? [];
  const hexes: string[] = [];
  for (const raw of matches) {
    const hex = normalizeCoachHexColor(raw);
    if (hex && !hexes.includes(hex)) hexes.push(hex);
    if (hexes.length >= 2) break;
  }
  if (hexes.length < 2) return null;
  const primary = hexes[0];
  const secondary = hexes[1];
  const justification = reply
    .replace(/PRINCIPALE\s*#?[0-9A-Fa-f]{6}/gi, '')
    .replace(/SECONDAIRE\s*#?[0-9A-Fa-f]{6}/gi, '')
    .replace(/[·•|—–-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
  return {
    ok: true,
    colors: { primary, secondary },
    label:
      justification.length > 8
        ? `Copilote : ${justification}`
        : `Copilote : ${describeColors(primary, secondary)}.`,
  };
}

const COLOR_NAMES: Record<string, string> = {
  bleu: '#1E88E5',
  blue: '#1E88E5',
  rouge: '#E53935',
  red: '#E53935',
  or: '#FFD60A',
  gold: '#FFD60A',
  dore: '#FFD60A',
  doré: '#FFD60A',
  jaune: '#FFD60A',
  yellow: '#FFD60A',
  vert: '#00E676',
  green: '#00E676',
  mint: '#00E676',
  noir: '#8B8B9A',
  black: '#8B8B9A',
  blanc: '#F5F5F5',
  white: '#F5F5F5',
  violet: '#BF5AF2',
  purple: '#BF5AF2',
  orange: '#FF6B35',
  rose: '#FF375F',
  pink: '#FF375F',
  grenat: '#A50044',
  bordeaux: '#A50044',
  burgundy: '#A50044',
  maroon: '#A50044',
  cyan: '#2DD4BF',
  turquoise: '#2DD4BF',
  gris: '#8B8B9A',
  gray: '#8B8B9A',
  grey: '#8B8B9A',
};

function normalizeIntent(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

function resolveColorName(token: string): string | null {
  const n = normalizeIntent(token);
  if (!n) return null;
  if (COLOR_NAMES[n]) return COLOR_NAMES[n];
  return normalizeCoachHexColor(token);
}

function extractColorTokens(fragment: string): string[] {
  const n = normalizeIntent(fragment);
  const found: string[] = [];
  const sorted = Object.keys(COLOR_NAMES).sort((a, b) => b.length - a.length);
  let remaining = n;

  while (remaining.length > 0) {
    let matched = false;
    for (const name of sorted) {
      const idx = remaining.indexOf(name);
      if (idx >= 0) {
        found.push(COLOR_NAMES[name]);
        remaining = remaining.slice(0, idx) + remaining.slice(idx + name.length);
        matched = true;
        break;
      }
    }
    if (!matched) break;
  }

  const hexMatch = fragment.match(/#?[0-9A-Fa-f]{6}/);
  if (hexMatch) {
    const hex = normalizeCoachHexColor(hexMatch[0]);
    if (hex) found.push(hex);
  }

  return found;
}

function describeColors(primary: string, secondary: string): string {
  const names = Object.entries(COLOR_NAMES);
  const label = (hex: string) => {
    const hit = names.find(([, v]) => v.toUpperCase() === hex.toUpperCase());
    return hit ? hit[0] : hex;
  };
  return `${label(primary)} + ${label(secondary)}`;
}

function presetToColors(preset: FootballTeamColorPreset): ClubThemeAiColors {
  return {
    primary: preset.accent,
    secondary: preset.accentSecondary,
  };
}

function presetLabel(preset: FootballTeamColorPreset): string {
  return `Proposition inspirée du ${preset.labelFr.replace(/^Style /, '')} : ${describeColors(preset.accent, preset.accentSecondary)}.`;
}

function buildSolidColors(accent: string): ClubThemeAiColors {
  return {
    primary: accent,
    secondary: deriveClubSecondaryColor(accent, 'club-ai-solid'),
  };
}

function buildMixColors(a: string, b: string): ClubThemeAiColors {
  return { primary: a, secondary: b };
}

function parseMixIntent(n: string, raw: string): ClubThemeAiResult | null {
  const mixPatterns = [
    /mix(?:e|er| de|)\s+(.+?)\s+(?:et|and|\+|avec)\s+(.+)/i,
    /melange(?:r|)\s+(.+?)\s+(?:et|and|\+|avec)\s+(.+)/i,
    /combine(?:r|)\s+(.+?)\s+(?:et|and|\+|avec)\s+(.+)/i,
    /(.+?)\s+(?:et|and)\s+(.+?)\s+(?:melange|mix|combine)/i,
    /un mix de\s+(.+?)\s+(?:et|and)\s+(.+)/i,
  ];

  for (const re of mixPatterns) {
    const m = raw.match(re) ?? n.match(re);
    if (!m) continue;
    const colorsA = extractColorTokens(m[1]);
    const colorsB = extractColorTokens(m[2]);
    const a = colorsA[0] ?? resolveColorName(m[1].trim());
    const b = colorsB[0] ?? resolveColorName(m[2].trim());
    if (a && b) {
      return {
        ok: true,
        colors: buildMixColors(a, b),
        label: `Proposition : mélange ${describeColors(a, b)}.`,
      };
    }
  }
  return null;
}

function parseSolidIntent(n: string, raw: string): ClubThemeAiResult | null {
  const solidPatterns = [
    /tout en\s+(\w+)/,
    /club\s+(\w+)/,
    /couleur\s+(\w+)/,
    /(?:je veux|i want)\s+(?:cette couleur|cette teinte|)(?:\s+pour mon club|\s+for my club)?[\s:,-]*(\w+)?/,
  ];

  for (const re of solidPatterns) {
    const m = n.match(re);
    if (!m) continue;
    const token = m[1] ?? '';
    const color = resolveColorName(token) ?? extractColorTokens(token)[0];
    if (color) {
      return {
        ok: true,
        colors: buildSolidColors(color),
        label: `Proposition : club en ${token || color}.`,
      };
    }
  }

  const singleColor = extractColorTokens(raw);
  if (
    singleColor.length === 1 &&
    (n.includes('couleur') || n.includes('color') || n.includes('club'))
  ) {
    return {
      ok: true,
      colors: buildSolidColors(singleColor[0]),
      label: 'Proposition : cette teinte pour le club.',
    };
  }

  return null;
}

function parseTeamIntent(n: string, raw: string): ClubThemeAiResult | null {
  const teamMarkers =
    /(?:style|inspire|inspiré|inspiree|comme|like|couleurs?\s+(?:du|de|of|comme))\s+/i;
  if (teamMarkers.test(raw) || teamMarkers.test(n)) {
    const preset = findTeamColorPreset(raw);
    if (preset) {
      return {
        ok: true,
        colors: presetToColors(preset),
        label: presetLabel(preset),
        presetId: preset.id,
      };
    }
  }

  const directPreset = findTeamColorPreset(raw);
  if (directPreset && (n.includes('style') || n.startsWith('inspire'))) {
    return {
      ok: true,
      colors: presetToColors(directPreset),
      label: presetLabel(directPreset),
      presetId: directPreset.id,
    };
  }

  if (directPreset && n.length <= 24) {
    return {
      ok: true,
      colors: presetToColors(directPreset),
      label: presetLabel(directPreset),
      presetId: directPreset.id,
    };
  }

  return null;
}

/**
 * Parse une demande couleur FR/EN → palette club (presets / mixes locaux).
 * Pour le texte libre non reconnu, le panneau Hub appelle le copilote Mistral.
 */
export function parseClubThemeAiIntent(text: string): ClubThemeAiResult {
  const raw = text.trim();
  const n = normalizeIntent(raw);
  if (!n || n.length < 3) {
    return { ok: false, message: CLUB_THEME_AI_FALLBACK_MESSAGE };
  }

  const team = parseTeamIntent(n, raw);
  if (team) return team;

  const mix = parseMixIntent(n, raw);
  if (mix) return mix;

  const solid = parseSolidIntent(n, raw);
  if (solid) return solid;

  const presetOnly = findTeamColorPreset(raw);
  if (presetOnly) {
    return {
      ok: true,
      colors: presetToColors(presetOnly),
      label: presetLabel(presetOnly),
      presetId: presetOnly.id,
    };
  }

  const colors = extractColorTokens(raw);
  if (colors.length >= 2) {
    return {
      ok: true,
      colors: buildMixColors(colors[0], colors[1]),
      label: `Proposition : ${describeColors(colors[0], colors[1])}.`,
    };
  }

  if (colors.length === 1) {
    return {
      ok: true,
      colors: buildSolidColors(colors[0]),
      label: 'Proposition : cette teinte pour le club.',
    };
  }

  return { ok: false, message: CLUB_THEME_AI_FALLBACK_MESSAGE };
}

/** Suggère une palette si le nom du club matche un preset connu. */
export function suggestClubColorsFromName(clubName: string | null | undefined): ClubThemeAiResult | null {
  const name = clubName?.trim();
  if (!name || name.length < 2) return null;
  const preset = findTeamColorPreset(name);
  if (!preset) return null;
  return {
    ok: true,
    colors: presetToColors(preset),
    label: presetLabel(preset),
    presetId: preset.id,
  };
}
