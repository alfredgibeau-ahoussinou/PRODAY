import type { AppSpaceId } from '../models/AppSpace';
import { isFeminineAppSpace, isUnderU13AppSpace } from '../models/AppSpace';
import type { ProductLineId } from '../models/ProductLine';
import type { PlayerSegment } from './playerSegment';

/** Espaces Mercato — football masculin / jeunes. */
export const CLASSIC_APP_SPACES: AppSpaceId[] = ['men', 'boys', 'under_u13'];

/** Espaces Mercato — football féminin / jeunes. */
export const FEMININE_APP_SPACES: AppSpaceId[] = ['women', 'girls', 'under_u13'];

/** True si le pôle (legacy woman) ou le segment UI demande le Mercato F. */
export function usesFeminineAppSpaces(
  line: ProductLineId,
  segment?: PlayerSegment | null,
): boolean {
  return line === 'woman' || segment === 'female';
}

export function getSelectableAppSpaces(
  line: ProductLineId,
  segment?: PlayerSegment | null,
): AppSpaceId[] {
  if (usesFeminineAppSpaces(line, segment)) return FEMININE_APP_SPACES;
  return CLASSIC_APP_SPACES;
}

export function defaultAppSpaceForProductLine(
  line: ProductLineId,
  segment?: PlayerSegment | null,
): AppSpaceId {
  if (usesFeminineAppSpaces(line, segment)) return 'women';
  return 'men';
}

export function isAppSpaceAllowedForProductLine(
  space: AppSpaceId,
  line: ProductLineId,
  segment?: PlayerSegment | null,
): boolean {
  if (usesFeminineAppSpaces(line, segment)) {
    return isFeminineAppSpace(space) || isUnderU13AppSpace(space);
  }
  return !isFeminineAppSpace(space);
}
