import type { User } from '../models/User';

export type SubScreenAudience = 'staff' | 'player' | 'signed';

/** Active l’enveloppe standard sur les sous-écrans (Mercato, détections, favoris…). */
export function isSubScreenShellEnabled(
  profile: User | null | undefined,
  audience: SubScreenAudience = 'signed'
): boolean {
  if (!profile) return false;
  if (audience === 'staff') {
    return (
      profile.role !== 'player' &&
      profile.role !== 'physio' &&
      profile.role !== 'sponsor' &&
      profile.role !== 'supporter' &&
      profile.role !== 'parent'
    );
  }
  if (audience === 'player') return profile.role === 'player';
  return true;
}
