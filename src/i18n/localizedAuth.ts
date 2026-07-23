import type { ProductLineId } from '../models/ProductLine';
import type { UserRole } from '../models/User';
import { isProFamilyLine } from '../utils/productLineResolution';
import { isSponsorAuthPreset } from '../utils/authBrandContext';
import type { TranslateFn } from './types';

function resolveAuthTeaserPrefix(
  line: ProductLineId,
  presetRole?: UserRole | null,
): string {
  if (line === 'sponsor' || isSponsorAuthPreset(presetRole)) return 'auth.teaser.sponsor';
  if (line === 'woman') return 'auth.teaser.woman';
  if (line === 'sante') return 'auth.teaser.sante';
  if (line === 'supporter') return 'auth.teaser.supporter';
  if (line === 'amateur') return 'auth.teaser.amateur';
  if (line === 'pro_player') return 'auth.teaser.pro_player';
  if (line === 'pro_club') return 'auth.teaser.pro_club';
  if (line === 'pro_staff') return 'auth.teaser.pro_staff';
  if (line === 'pro' || isProFamilyLine(line)) return 'auth.teaser.pro';
  return 'auth.teaser.homme';
}

export function getAuthSignupTeaser(
  line: ProductLineId,
  t: TranslateFn,
  presetRole?: UserRole | null,
): string[] {
  const prefix = resolveAuthTeaserPrefix(line, presetRole);
  return [0, 1, 2].map((i) => t(`${prefix}.${i}`));
}
