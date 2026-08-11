import type { Gender } from '../models/User';
import type { PlayerLevelId } from '../models/PlayerLevel';
import { PLAYER_LEVEL_BADGES } from '../models/PlayerLevel';

/** Libellé support admin — Homme / Femme / Mineur (ou tiret si absent). */
export function adminGenderLabel(gender: Gender | null | undefined): string {
  if (gender === 'men') return 'Homme';
  if (gender === 'women') return 'Femme';
  if (gender === 'minor') return 'Mineur';
  return '—';
}

/** Libellé court du badge niveau (Amateur / Formation / Haut niveau) pour listes admin. */
export function adminPlayerLevelLabel(
  level: PlayerLevelId | null | undefined,
  opts?: { short?: boolean },
): string | null {
  if (!level) return null;
  const badge = PLAYER_LEVEL_BADGES[level];
  return opts?.short ? badge.shortLabel : badge.label;
}
