import type { ProductLineId } from '../models/ProductLine';
import type { Gender, User } from '../models/User';
import { isYouthAppSpace } from './minorYouthSpace';
import { isMinorUser } from './minor';

/** Segment joueur — pilote thème UI et chrome pôle (homme/femme/mineur). */
export type PlayerSegment = 'male' | 'female' | 'minor';

export function genderToPlayerSegment(gender: Gender): PlayerSegment {
  if (gender === 'minor') return 'minor';
  if (gender === 'women') return 'female';
  return 'male';
}

export function playerSegmentToGender(segment: PlayerSegment): Gender {
  if (segment === 'female') return 'women';
  if (segment === 'minor') return 'minor';
  return 'men';
}

/** Lignes où le segment joueur influence le thème. */
export function lineUsesPlayerSegment(line: ProductLineId): boolean {
  return line === 'amateur' || line === 'pro_player';
}

/**
 * Résout le segment UI d'un compte joueur.
 * Fallback : genre profil → espace foot → pôle legacy homme/woman.
 */
export function resolvePlayerSegment(
  user: Pick<User, 'profile' | 'product_line' | 'role' | 'app_space' | 'parental_settings'>,
  productLine: ProductLineId,
): PlayerSegment | null {
  if (user.role !== 'player') return null;
  if (!lineUsesPlayerSegment(productLine)) {
    if (productLine === 'homme') return 'male';
    if (productLine === 'woman') return 'female';
    return null;
  }

  const declared = user.profile?.gender;
  if (declared) return genderToPlayerSegment(declared);

  if (user.product_line === 'woman') return 'female';
  if (user.product_line === 'homme' || user.product_line === 'standard') return 'male';

  if (isMinorUser(user)) return 'minor';

  const space = user.app_space;
  if (space === 'women' || space === 'girls') return 'female';
  if (space && isYouthAppSpace(space)) return 'minor';

  return 'male';
}

/** Clé thème stable pour logs / tests. */
export function playerSegmentThemeKey(
  line: ProductLineId,
  segment: PlayerSegment,
): string {
  if (line === 'pro_player') return `pro_player_${segment}`;
  if (line === 'amateur') return `amateur_${segment}`;
  return line;
}
