import { isV3ShellEnabled } from '../config/featureFlags';
import type { User } from '../models/User';

export type V3SubScreenAudience = 'staff' | 'player' | 'signed';

/** Active le shell V3 sur les sous-écrans (Mercato, détections, favoris…). */
export function isV3SubScreenEnabled(
  profile: User | null | undefined,
  audience: V3SubScreenAudience = 'signed'
): boolean {
  if (!isV3ShellEnabled() || !profile) return false;
  if (audience === 'staff') {
    return profile.role !== 'player' && profile.role !== 'physio' && profile.role !== 'sponsor';
  }
  if (audience === 'player') return profile.role === 'player';
  return true;
}
