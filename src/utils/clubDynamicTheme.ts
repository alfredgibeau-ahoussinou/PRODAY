import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  deriveClubSecondaryColor,
  resolveClubBrandColors,
  type ClubBrandColorSource,
  type ClubBrandColors,
  type ClubBrandInput,
} from './clubBrandColors';
import { normalizeCoachHexColor } from './coachColorPicker';
import { COACH_TEAM_ACCENT_PALETTE, resolveCoachOnAccent } from './coachTeamTheme';
import { blendHex } from './colorBlend';
import { CLUB_TOKENS, type ClubThemeTokens } from '../features/club/theme/clubTokens';

const CACHE_PREFIX = '@proday/club_logo_accent';

export type ClubDynamicBrand = ClubBrandColors & {
  onAccent: string;
  cacheKey: string;
};

function hashKey(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return Math.abs(hash);
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return null;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
}

function withAlpha(hex: string, alpha: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function darkenHex(hex: string, amount: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const factor = 1 - amount;
  return `#${[rgb.r, rgb.g, rgb.b]
    .map((v) => Math.round(v * factor).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

/** Accent dérivé de l’URI logo (stable tant que l’URL ne change pas). */
export function accentFromLogoUri(logoUri: string): string {
  const index = hashKey(logoUri.trim()) % COACH_TEAM_ACCENT_PALETTE.length;
  return COACH_TEAM_ACCENT_PALETTE[index] ?? CLUB_TOKENS.accent;
}

function cacheKeyFor(input: {
  clubId?: string | null;
  teamId?: string | null;
  logoUri?: string | null;
}): string {
  const scope = input.teamId?.trim() || input.clubId?.trim() || 'club';
  const logo = input.logoUri?.trim() || 'nologo';
  return `${CACHE_PREFIX}:${scope}:${logo}`;
}

async function readCachedBrand(key: string): Promise<ClubBrandColors | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ClubBrandColors>;
    const primary = parsed.primary ? normalizeCoachHexColor(parsed.primary) : null;
    const secondary = parsed.secondary ? normalizeCoachHexColor(parsed.secondary) : null;
    if (!primary || !secondary) return null;
    const source: ClubBrandColorSource =
      parsed.source === 'stored' || parsed.source === 'logo' || parsed.source === 'hash'
        ? parsed.source
        : 'logo';
    return { primary, secondary, source };
  } catch {
    return null;
  }
}

async function writeCachedBrand(key: string, brand: ClubBrandColors): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(brand));
  } catch {
    /* ignore */
  }
}

/**
 * Sur le web, tente une couleur dominante via canvas.
 * Sur natif (sans module pixels), dérive un accent stable depuis l’URI logo.
 */
export async function extractColorsFromLogoUri(
  logoUri: string,
): Promise<{ primary: string; secondary: string } | null> {
  const uri = logoUri.trim();
  if (!uri) return null;

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    try {
      const sampled = await sampleDominantColorWeb(uri);
      if (sampled) {
        return {
          primary: sampled,
          secondary: deriveClubSecondaryColor(sampled, uri),
        };
      }
    } catch {
      /* fallback hash */
    }
  }

  const primary = accentFromLogoUri(uri);
  return {
    primary,
    secondary: deriveClubSecondaryColor(primary, uri),
  };
}

function sampleDominantColorWeb(uri: string): Promise<string | null> {
  return new Promise((resolve) => {
    type HtmlImage = {
      crossOrigin: string | null;
      onload: (() => void) | null;
      onerror: (() => void) | null;
      src: string;
    };
    const g = globalThis as unknown as {
      Image?: new () => HtmlImage;
      document?: {
        createElement: (tag: string) => {
          width: number;
          height: number;
          getContext: (id: string) => {
            drawImage: (img: HtmlImage, x: number, y: number, w: number, h: number) => void;
            getImageData: (
              x: number,
              y: number,
              w: number,
              h: number,
            ) => { data: Uint8ClampedArray };
          } | null;
        };
      };
    };
    if (!g.Image || !g.document) {
      resolve(null);
      return;
    }
    const img = new g.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = g.document!.createElement('canvas');
        const size = 24;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        let r = 0;
        let gSum = 0;
        let b = 0;
        let n = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3] ?? 0;
          if (a < 128) continue;
          const pr = data[i] ?? 0;
          const pg = data[i + 1] ?? 0;
          const pb = data[i + 2] ?? 0;
          const max = Math.max(pr, pg, pb);
          const min = Math.min(pr, pg, pb);
          if (max > 245 && min > 230) continue;
          if (max < 28) continue;
          r += pr;
          gSum += pg;
          b += pb;
          n += 1;
        }
        if (n < 4) {
          resolve(null);
          return;
        }
        const hex = `#${[r / n, gSum / n, b / n]
          .map((v) => Math.round(v).toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase()}`;
        resolve(normalizeCoachHexColor(hex));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = uri;
  });
}

export type ResolveClubDynamicBrandInput = {
  club?: (ClubBrandInput & { logo_url?: string | null }) | null;
  teamId?: string | null;
  /** Logo équipe prioritaire si fourni, sinon logo club. */
  teamLogoUri?: string | null;
};

/**
 * Résout les couleurs club/équipe :
 * 1) couleurs stockées club
 * 2) extraction / dérivation depuis logo (cache AsyncStorage par teamId|clubId + URI)
 * 3) hash id/nom
 * En espace équipe : légère teinte secondaire liée au teamId.
 */
export async function resolveClubDynamicBrand(
  input: ResolveClubDynamicBrandInput,
): Promise<ClubDynamicBrand> {
  const club = input.club;
  const logoUri = (input.teamLogoUri ?? club?.logo_url)?.trim() || null;
  const key = cacheKeyFor({
    clubId: club?.id,
    teamId: input.teamId,
    logoUri,
  });

  const stored = resolveClubBrandColors(club);
  let brand: ClubBrandColors;

  if (stored?.source === 'stored') {
    brand = stored;
  } else {
    const cached = await readCachedBrand(key);
    if (cached) {
      brand = cached;
    } else if (logoUri) {
      const extracted = await extractColorsFromLogoUri(logoUri);
      brand = extracted
        ? { ...extracted, source: 'logo' as const }
        : stored ?? {
            primary: CLUB_TOKENS.accent,
            secondary: CLUB_TOKENS.accentDeep,
            source: 'hash' as const,
          };
      await writeCachedBrand(key, brand);
    } else {
      brand =
        stored ??
        ({
          primary: CLUB_TOKENS.accent,
          secondary: CLUB_TOKENS.accentDeep,
          source: 'hash',
        } as ClubBrandColors);
    }
  }

  if (input.teamId?.trim()) {
    const teamTint = accentFromLogoUri(`team:${input.teamId}`);
    brand = {
      ...brand,
      secondary: blendHex(brand.secondary, teamTint, 0.35),
    };
  }

  return {
    ...brand,
    onAccent: resolveCoachOnAccent(brand.primary),
    cacheKey: key,
  };
}

/** Construit les tokens UI Club à partir d’une marque dynamique (canvas sombre). */
export function buildClubThemeTokens(
  brand?: Pick<ClubDynamicBrand, 'primary' | 'secondary' | 'onAccent'> | null,
): ClubThemeTokens {
  const accent = brand?.primary ? normalizeCoachHexColor(brand.primary) ?? CLUB_TOKENS.accent : CLUB_TOKENS.accent;
  const secondary =
    brand?.secondary
      ? normalizeCoachHexColor(brand.secondary) ?? deriveClubSecondaryColor(accent)
      : deriveClubSecondaryColor(accent, 'club');
  const onAccent = brand?.onAccent ?? resolveCoachOnAccent(accent);

  return {
    ...CLUB_TOKENS,
    accent,
    accentSoft: withAlpha(accent, 0.22),
    accentDeep: darkenHex(accent, 0.38),
    secondary,
    onAccent,
    glow: withAlpha(accent, 0.42),
    // Lavage sombre teinté (pas d’éclaircissement type UI admin claire).
    headerWash: blendHex(CLUB_TOKENS.bg, accent, 0.28),
  };
}
