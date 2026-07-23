import {
  brandForProductLine,
  PRODAY_SPONSOR_BRAND,
  type ProductLineId,
} from '../models/ProductLine';
import type { UserRole } from '../models/User';
import { getSponsorAppColors } from '../content/sponsorExperience';
import { getThemedColorsForLine, type AppColors } from '../theme/universeTheme';
import type { PlayerSegment } from './playerSegment';

/** Parcours auth / signup partenaire (carousel Sponsor ou CTA pricing). */
export function isSponsorAuthPreset(role: UserRole | null | undefined): boolean {
  return role === 'sponsor';
}

export function brandForAuthContext(
  line: ProductLineId,
  presetRole?: UserRole | null,
) {
  if (isSponsorAuthPreset(presetRole)) return PRODAY_SPONSOR_BRAND;
  return brandForProductLine(line);
}

export function colorsForAuthContext(
  line: ProductLineId,
  presetRole?: UserRole | null,
  playerSegment?: PlayerSegment | null,
): AppColors {
  if (isSponsorAuthPreset(presetRole)) return getSponsorAppColors();
  return getThemedColorsForLine(line, playerSegment);
}

/** Alignement preset ↔ ligne pro (évite logo/thème Sponsor sur Pro Joueur). */
export function reconcileProSignupPreset(
  line: ProductLineId,
  preset: UserRole | null,
): UserRole | null {
  if (!preset) return null;
  if (line === 'pro_player') return preset === 'player' ? 'player' : 'player';
  if (line === 'pro_club') return preset === 'club' ? 'club' : 'club';
  if (line === 'pro_staff' || line === 'pro') {
    if (
      preset === 'coach' ||
      preset === 'agent' ||
      preset === 'recruiter' ||
      preset === 'organizer' ||
      preset === 'sponsor'
    ) {
      return preset;
    }
    return 'coach';
  }
  return null;
}
