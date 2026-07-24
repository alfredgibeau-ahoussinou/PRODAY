import type { AppSpaceId } from '../models/AppSpace';
import { normalizeAppSpace } from '../models/AppSpace';
import type { ProductLineId } from '../models/ProductLine';
import type { User } from '../models/User';
import { getSelectableAppSpaces } from './appSpaceProductLine';
import { isMinorUser } from './minor';
import { isFemalePresentationForUser, resolvePlayerSegment } from './playerSegment';

const YOUTH_SPACES: AppSpaceId[] = ['under_u13', 'boys', 'girls'];

export function isYouthAppSpace(space: AppSpaceId): boolean {
  return YOUTH_SPACES.includes(space);
}

/** Espace jeunes imposé pour un compte mineur selon âge et pôle. */
export function resolveYouthAppSpaceForMinor(
  user: User,
  productLine: ProductLineId,
): AppSpaceId {
  const age = user.profile?.age;
  const feminine = isFemalePresentationForUser(user, productLine);

  if (age != null) {
    if (age < 13) return 'under_u13';
    if (feminine || user.app_space === 'girls') return 'girls';
    return 'boys';
  }

  const current = normalizeAppSpace(user.app_space);
  if (isYouthAppSpace(current)) return current;
  if (feminine) return 'girls';
  return 'boys';
}

export function getSelectableAppSpacesForUser(
  user: User,
  productLine: ProductLineId,
): AppSpaceId[] {
  const segment = resolvePlayerSegment(user, productLine);
  const all = getSelectableAppSpaces(productLine, segment);
  if (!isMinorUser(user)) return all;
  return all.filter((space) => isYouthAppSpace(space));
}
