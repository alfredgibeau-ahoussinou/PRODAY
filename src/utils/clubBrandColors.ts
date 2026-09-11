import { COACH_TEAM_ACCENT_PALETTE } from './coachTeamTheme';
import { normalizeCoachHexColor } from './coachColorPicker';

export type ClubBrandColorSource = 'stored' | 'logo' | 'hash';

export type ClubBrandColors = {
  primary: string;
  secondary: string;
  source: ClubBrandColorSource;
};

export type ClubBrandInput = {
  id: string;
  name: string;
  primary_color?: string | null;
  secondary_color?: string | null;
};

function hashKey(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return Math.abs(hash);
}

/** Couleur secondaire dérivée — teinte voisine dans la palette coach. */
export function deriveClubSecondaryColor(primary: string, seed = ''): string {
  const index = hashKey(`${primary}:${seed}`) % COACH_TEAM_ACCENT_PALETTE.length;
  const candidate = COACH_TEAM_ACCENT_PALETTE[index] ?? primary;
  return candidate === primary
    ? (COACH_TEAM_ACCENT_PALETTE[(index + 1) % COACH_TEAM_ACCENT_PALETTE.length] ?? primary)
    : candidate;
}

/** Couleurs club — champs Firestore ou hash stable sur id/nom. */
export function resolveClubBrandColors(club: ClubBrandInput | null | undefined): ClubBrandColors | null {
  if (!club?.id && !club?.name?.trim()) return null;

  const storedPrimary = club.primary_color
    ? normalizeCoachHexColor(String(club.primary_color))
    : null;
  const storedSecondary = club.secondary_color
    ? normalizeCoachHexColor(String(club.secondary_color))
    : null;

  if (storedPrimary) {
    return {
      primary: storedPrimary,
      secondary: storedSecondary ?? deriveClubSecondaryColor(storedPrimary, club.id),
      source: 'stored',
    };
  }

  const nameLower = (club.name || '').toLowerCase();
  if (nameLower.includes('proday') || nameLower.includes('fc proday')) {
    return {
      primary: '#006CFC',
      secondary: '#2DD4BF',
      source: 'hash',
    };
  }

  const key = club.id?.trim() || club.name.trim();
  const index = hashKey(key) % COACH_TEAM_ACCENT_PALETTE.length;
  const primary = COACH_TEAM_ACCENT_PALETTE[index] ?? COACH_TEAM_ACCENT_PALETTE[0];
  const secondary =
    COACH_TEAM_ACCENT_PALETTE[(index + 3) % COACH_TEAM_ACCENT_PALETTE.length] ??
    deriveClubSecondaryColor(primary, key);

  return { primary, secondary, source: 'hash' };
}
