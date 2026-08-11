import {
  brandForProductLine,
  PRODAY_PARENT_BRAND,
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

/** Parcours auth / signup Parent (carousel Pôle Parent). */
export function isParentAuthPreset(role: UserRole | null | undefined): boolean {
  return role === 'parent';
}

export function brandForAuthContext(
  line: ProductLineId,
  presetRole?: UserRole | null,
) {
  if (line === 'sponsor' || isSponsorAuthPreset(presetRole)) return PRODAY_SPONSOR_BRAND;
  if (line === 'parent' || isParentAuthPreset(presetRole)) return PRODAY_PARENT_BRAND;
  return brandForProductLine(line);
}

export function colorsForAuthContext(
  line: ProductLineId,
  presetRole?: UserRole | null,
  playerSegment?: PlayerSegment | null,
): AppColors {
  if (line === 'sponsor' || isSponsorAuthPreset(presetRole)) return getSponsorAppColors();
  if (line === 'parent' || isParentAuthPreset(presetRole)) {
    return getThemedColorsForLine('parent', playerSegment);
  }
  return getThemedColorsForLine(line, playerSegment);
}

/** Alignement preset ↔ ligne produit (évite fuite Sponsor ↔ Staff / Parent ↔ Joueur). */
export function reconcileProSignupPreset(
  line: ProductLineId,
  preset: UserRole | null,
): UserRole | null {
  if (line === 'sponsor') return 'sponsor';
  if (line === 'parent') return 'parent';
  if (!preset) return null;
  if (line === 'pro_player') return 'player';
  if (line === 'pro_club') return 'club';
  if (line === 'pro_staff' || line === 'pro') {
    if (
      preset === 'coach' ||
      preset === 'agent' ||
      preset === 'recruiter' ||
      preset === 'organizer'
    ) {
      return preset;
    }
    // Ancien preset sponsor / parent ne doit plus rester sous Staff
    return 'coach';
  }
  return null;
}
