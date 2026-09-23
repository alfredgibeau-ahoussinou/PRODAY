import { COACH_SITE } from '../content/coachPageIdentity';
import { normalizeCoachHexColor } from './coachColorPicker';
import type { Membership } from '../models/Membership';
import type { TeamEvent } from '../models/TeamEvent';
import { isCoachTrainingEvent } from '../models/TeamEvent';

export type CoachShellVariant = 'solid' | 'clear';

export type CoachAccentMode = 'auto' | 'manual';

export type CoachThemeTokens = {
  accent: string;
  /** Texte/icônes sur fond accent (blanc ou sombre selon luminance). */
  onAccent: string;
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

/** Surfaces iOS grouped — variante Clair du Pôle Coach (exporté pour les tableaux à double mode). */
export const COACH_CLEAR_SURFACES = {
  bg: '#FFFFFF',
  surface: '#F2F2F7',
  elevated: '#E5E5EA',
  border: 'rgba(0, 0, 0, 0.12)',
  foreground: '#1C1C1E',
  muted: 'rgba(60, 60, 67, 0.6)',
} as const;

/** Accents premium lisibles sur fond sombre — index 0 = vert Coach officiel. */
export const COACH_TEAM_ACCENT_PALETTE = [
  '#22C55E',
  '#1E3AFF',
  '#7C3AED',
  '#00E676',
  '#006CFC',
  '#06B6D4',
  '#EF4444',
  '#0054F0',
  '#A3A3A3',
  '#6366F1',
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

/** Alpha appliqué à un hex — partagé par les écrans Coach convertis aux jetons. */
export function withAlpha(hex: string, alpha: number): string {
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

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Couleur de texte/icône lisible sur un fond accent coach. */
export function resolveCoachOnAccent(hex: string): string {
  const rgb = parseHex(hex);
  if (!rgb) return '#FFFFFF';
  return relativeLuminance(rgb.r, rgb.g, rgb.b) > 0.62 ? '#1C1C1E' : '#FFFFFF';
}

export function resolveCoachTeamAccent(teamId?: string, teamName?: string): string {
  const key = teamId?.trim() || teamName?.trim();
  if (!key) return PRODAY_ACCENT;
  const index = hashKey(key) % COACH_TEAM_ACCENT_PALETTE.length;
  return COACH_TEAM_ACCENT_PALETTE[index] ?? PRODAY_ACCENT;
}

export function resolveCoachEffectiveAccent(input: {
  accentMode?: CoachAccentMode;
  accentOverride?: string;
  teamId?: string;
  teamName?: string;
  /** Couleur primaire du club licencié — prioritaire en mode auto. */
  clubAccent?: string | null;
}): string {
  if (input.accentMode === 'manual' && input.accentOverride) {
    const hex = normalizeCoachHexColor(input.accentOverride);
    if (hex) return hex;
  }
  const club = input.clubAccent ? normalizeCoachHexColor(input.clubAccent) : null;
  if (club) return club;
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
  clubAccent?: string | null;
}): CoachThemeTokens {
  const accent = resolveCoachEffectiveAccent(input);
  const surfaces = shellSurfaces(input.variant);
  const teamLabel = input.teamName?.trim() || '';
  const softAlpha = input.variant === 'clear' ? 0.12 : 0.22;
  const glowAlpha = input.variant === 'clear' ? 0.18 : 0.28;

  return {
    accent,
    onAccent: resolveCoachOnAccent(accent),
    deep: darkenHex(accent, 0.45),
    soft: withAlpha(accent, softAlpha),
    glow: withAlpha(accent, glowAlpha),
    ...surfaces,
    variant: input.variant,
    teamLabel,
  };
}

/** Toutes les équipes où le coach est dans `coach_uids`. */
export function listCoachTeams<T extends { id: string; coach_uids: string[] }>(
  teams: T[],
  uid: string,
): T[] {
  return teams.filter((team) => team.coach_uids.includes(uid));
}

/** Résout l’équipe coach préférée dans un club. */
export function pickCoachTeam<
  T extends { id: string; coach_uids: string[]; is_default: boolean },
>(teams: T[], uid: string): T | undefined {
  const assigned = listCoachTeams(teams, uid);
  if (assigned.length > 0) return assigned[0];
  return teams.find((team) => team.is_default) ?? teams[0];
}

/** Joueurs actifs rattachés à une équipe via membership. */
export function filterMembersForTeam<T extends { uid: string }>(
  members: T[],
  memberships: Array<{ status: string; team_id: string; player_uid: string }>,
  teamId: string | undefined,
): T[] {
  if (!teamId) return members;
  const uids = new Set(
    memberships
      .filter((m) => m.status === 'active' && m.team_id === teamId)
      .map((m) => m.player_uid),
  );
  return members.filter((m) => uids.has(m.uid));
}

/** UIDs joueurs actifs d’une équipe (memberships). */
export function teamPlayerUids(memberships: Membership[], teamId?: string): string[] {
  if (!teamId) return [];
  return memberships
    .filter((m) => m.status === 'active' && m.team_id === teamId)
    .map((m) => m.player_uid);
}

/** Événement rattaché à l’équipe (team_id explicite ou chevauchement legacy). */
export function eventBelongsToTeam(
  event: TeamEvent,
  teamId: string | undefined,
  teamUids: string[],
): boolean {
  if (!teamId) return true;
  if (event.team_id) return event.team_id === teamId;

  const invitees = event.invitee_uids;
  if (invitees.length === 0) return false;

  const teamSet = new Set(teamUids);
  const overlap = invitees.filter((uid) => teamSet.has(uid)).length;
  if (overlap === 0) return false;

  const majority = Math.ceil(invitees.length / 2);
  return overlap >= majority || overlap === invitees.length;
}

/** Entraînements visibles pour l’équipe active du coach. */
export function filterTrainingsForTeam(
  events: TeamEvent[],
  teamId: string | undefined,
  teamUids: string[],
): TeamEvent[] {
  return events.filter(
    (event) =>
      isCoachTrainingEvent(event) && eventBelongsToTeam(event, teamId, teamUids),
  );
}

/** Demandes d’affiliation en attente pour une équipe. */
export function filterPendingForTeam<T extends { status: string; team_id: string }>(
  pending: T[],
  teamId: string | undefined,
): T[] {
  const rows = pending.filter((m) => m.status === 'pending');
  if (!teamId) return rows;
  return rows.filter((m) => m.team_id === teamId);
}
