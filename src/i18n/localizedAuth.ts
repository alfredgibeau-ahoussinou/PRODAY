import type { ProductLineId } from '../models/ProductLine';
import { isProFamilyLine } from '../utils/productLineResolution';
import type { TranslateFn } from './types';

function resolveAuthTeaserPrefix(line: ProductLineId): string {
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

export function getAuthSignupTeaser(line: ProductLineId, t: TranslateFn): string[] {
  const prefix = resolveAuthTeaserPrefix(line);
  return [0, 1, 2].map((i) => t(`${prefix}.${i}`));
}
