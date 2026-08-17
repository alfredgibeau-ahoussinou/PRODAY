import { COACH_SITE } from '../content/coachPageIdentity';

export type CoachShellVariant = 'solid' | 'clear';

export type CoachAccentMode = 'auto' | 'manual';

export type CoachThemeTokens = {
  accent: string;
  deep: string;
  soft: string;
  glow: string;
  bg: string;
  surface: string;
  elevated: string;
  border: string;
  foreground: string;
  muted: string;
  /** Fond clair (variante Clair) — StatusBar, contrastes. */
  isLight: boolean;
  variant: CoachShellVariant;
  teamLabel: string;
};

/** Surfaces iOS grouped — variante Clair du Pôle Coach. */
const COACH_CLEAR_SURFACES = {
  bg: '#FFFFFF',
  surface: '#F2F2F7',
  elevated: '#E5E5EA',
  border: 'rgba(0, 0, 0, 0.12)',
  foreground: '#1C1C1E',
  muted: 'rgba(60, 60, 67, 0.6)',
} as const;

/** Accents premium lisibles sur fond sombre — index 0 = bleu PRODAY (fallback). */
export const COACH_TEAM_ACCENT_PALETTE = [
  '#006CFC',
  '#FF6B35',
  '#00C896',
  '#FFD60A',
  '#BF5AF2',
  '#FF375F',
  '#32ADE6',
  '#30D158',
  '#FF9F0A',
  '#64D2FF',
] as const;

const PRODAY_ACCENT = COACH_SITE.accent;

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
  const r = Math.round(rgb.r * factor);
  const g = Math.round(rgb.g * factor);
  const b = Math.round(rgb.b * factor);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function resolveCoachTeamAccent(teamId?: string, teamName?: string): string {
  const key = teamId?.trim() || teamName?.trim();
  if (!key) return PRODAY_ACCENT;
  const index = hashKey(key) % COACH_TEAM_ACCENT_PALETTE.length;
  return COACH_TEAM_ACCENT_PALETTE[index] ?? PRODAY_ACCENT;
}

function isPaletteAccent(hex: string): boolean {
  const normalized = hex.trim().toUpperCase();
  return COACH_TEAM_ACCENT_PALETTE.some((color) => color.toUpperCase() === normalized);
}

export function resolveCoachEffectiveAccent(input: {
  accentMode?: CoachAccentMode;
  accentOverride?: string;
  teamId?: string;
  teamName?: string;
}): string {
  if (input.accentMode === 'manual' && input.accentOverride && isPaletteAccent(input.accentOverride)) {
    return input.accentOverride;
  }
  return resolveCoachTeamAccent(input.teamId, input.teamName);
}

function shellSurfaces(variant: CoachShellVariant): Pick<
  CoachThemeTokens,
  'bg' | 'surface' | 'elevated' | 'border' | 'foreground' | 'muted' | 'isLight'
> {
  if (variant === 'clear') {
    return { ...COACH_CLEAR_SURFACES, isLight: true };
  }
  return {
    bg: COACH_SITE.bg,
    surface: COACH_SITE.surface,
    elevated: COACH_SITE.elevated,
    border: COACH_SITE.border,
    foreground: COACH_SITE.foreground,
    muted: COACH_SITE.muted,
    isLight: false,
  };
}

export function buildCoachThemeTokens(input: {
  variant: CoachShellVariant;
  teamId?: string;
  teamName?: string;
  accentMode?: CoachAccentMode;
  accentOverride?: string;
}): CoachThemeTokens {
  const accent = resolveCoachEffectiveAccent(input);
  const surfaces = shellSurfaces(input.variant);
  const teamLabel = input.teamName?.trim() || '';
  const softAlpha = input.variant === 'clear' ? 0.12 : 0.22;
  const glowAlpha = input.variant === 'clear' ? 0.18 : 0.28;

  return {
    accent,
    deep: darkenHex(accent, 0.45),
    soft: withAlpha(accent, softAlpha),
    glow: withAlpha(accent, glowAlpha),
    ...surfaces,
    variant: input.variant,
    teamLabel,
  };
}

/** Résout l’équipe coach préférée dans un club. */
export function pickCoachTeam<
  T extends { id: string; coach_uids: string[]; is_default: boolean },
>(teams: T[], uid: string): T | undefined {
  return (
    teams.find((team) => team.coach_uids.includes(uid)) ??
    teams.find((team) => team.is_default) ??
    teams[0]
  );
}
