import { PLAYER_DARK } from '../theme/playerDarkPremium';
import type { PlayerThemePrefs } from '../models/PlayerThemePrefs';
import { normalizeCoachHexColor } from './coachColorPicker';
import { deriveClubSecondaryColor, type ClubBrandColors } from './clubBrandColors';

export type ResolvedPlayerThemeColors = {
  mode: PlayerThemePrefs['mode'];
  accent: string;
  accentAlt: string;
  accentSoft: string;
  accentGlow: string;
  bg: string;
  surface: string;
  surfaceRaised: string;
};

/** Palette prédéfinie — football-friendly, lisible sur fond sombre. */
export const PLAYER_THEME_SWATCHES = [
  '#00E676',
  '#2DD4BF',
  '#006CFC',
  '#FF6B35',
  '#FFD60A',
  '#BF5AF2',
  '#FF375F',
  '#30D158',
  '#FF9F0A',
  '#64D2FF',
  '#E53935',
  '#1E88E5',
] as const;

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

function deriveAccentAlt(accent: string): string {
  return deriveClubSecondaryColor(accent, 'player-theme');
}

function buildResolved(
  mode: PlayerThemePrefs['mode'],
  accent: string,
  accentAlt: string,
  background?: string,
  surface?: string,
): ResolvedPlayerThemeColors {
  const bg = background ? normalizeCoachHexColor(background) ?? PLAYER_DARK.bg : PLAYER_DARK.bg;
  const surfaceColor =
    surface ? normalizeCoachHexColor(surface) ?? PLAYER_DARK.surface : PLAYER_DARK.surface;

  return {
    mode,
    accent,
    accentAlt,
    accentSoft: withAlpha(accent, 0.14),
    accentGlow: withAlpha(accentAlt, 0.35),
    bg,
    surface: surfaceColor,
    surfaceRaised: surface ? surfaceColor : PLAYER_DARK.surfaceRaised,
  };
}

export function sanitizePlayerThemePrefs(raw: unknown): PlayerThemePrefs {
  if (!raw || typeof raw !== 'object') return { mode: 'default' };
  const data = raw as Record<string, unknown>;
  const mode = data.mode;
  if (mode !== 'default' && mode !== 'club' && mode !== 'custom') {
    return { mode: 'default' };
  }

  if (mode !== 'custom') return { mode };

  const customRaw = data.custom;
  if (!customRaw || typeof customRaw !== 'object') return { mode: 'default' };

  const customData = customRaw as Record<string, unknown>;
  const accent = normalizeCoachHexColor(String(customData.accent ?? ''));
  if (!accent) return { mode: 'default' };

  const custom: PlayerThemePrefs['custom'] = { accent };
  const secondary = normalizeCoachHexColor(String(customData.accentSecondary ?? ''));
  if (secondary) custom.accentSecondary = secondary;
  const background = normalizeCoachHexColor(String(customData.background ?? ''));
  if (background) custom.background = background;
  const surface = normalizeCoachHexColor(String(customData.surface ?? ''));
  if (surface) custom.surface = surface;

  return { mode: 'custom', custom };
}

/** Résout les couleurs UI du pôle joueur selon prefs + club. */
export function resolvePlayerThemeColors(
  prefs: PlayerThemePrefs | null | undefined,
  clubColors: ClubBrandColors | null | undefined,
): ResolvedPlayerThemeColors {
  const mode = prefs?.mode ?? 'default';

  if (mode === 'custom') {
    const accent = prefs?.custom?.accent
      ? normalizeCoachHexColor(prefs.custom.accent)
      : null;
    if (accent) {
      const accentAlt =
        prefs?.custom?.accentSecondary
          ? normalizeCoachHexColor(prefs.custom.accentSecondary) ?? deriveAccentAlt(accent)
          : deriveAccentAlt(accent);
      return buildResolved(
        'custom',
        accent,
        accentAlt,
        prefs?.custom?.background,
        prefs?.custom?.surface,
      );
    }
  }

  if (mode === 'club' && clubColors?.primary) {
    return buildResolved('club', clubColors.primary, clubColors.secondary);
  }

  return buildResolved('default', PLAYER_DARK.accent, PLAYER_DARK.accentAlt);
}
