import type { AppSpaceId } from '../models/AppSpace';
import { isFeminineAppSpace, isUnderU13AppSpace } from '../models/AppSpace';
import type { ProductLineId } from '../models/ProductLine';

/** Espaces Mercato — ProDay Homme & Pro (masculin / jeunes). */
export const CLASSIC_APP_SPACES: AppSpaceId[] = ['men', 'boys', 'under_u13'];

/** Espaces Mercato — ProDay Woman (football féminin). */
export const FEMININE_APP_SPACES: AppSpaceId[] = ['women', 'girls', 'under_u13'];

export function getSelectableAppSpaces(line: ProductLineId): AppSpaceId[] {
  if (line === 'woman') return FEMININE_APP_SPACES;
  return CLASSIC_APP_SPACES;
}

export function defaultAppSpaceForProductLine(line: ProductLineId): AppSpaceId {
  if (line === 'woman') return 'women';
  return 'men';
}

export function isAppSpaceAllowedForProductLine(
  space: AppSpaceId,
  line: ProductLineId
): boolean {
  if (line === 'woman') return isFeminineAppSpace(space) || isUnderU13AppSpace(space);
  return !isFeminineAppSpace(space);
}
