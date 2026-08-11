import type { AppSpaceId } from '../models/AppSpace';

/** Espaces app jeunes (U13 / garçons / filles). Module partagé — évite les cycles Require. */
export const YOUTH_APP_SPACES: readonly AppSpaceId[] = ['under_u13', 'boys', 'girls'];

export function isYouthAppSpace(space: AppSpaceId): boolean {
  return (YOUTH_APP_SPACES as readonly string[]).includes(space);
}
