import {
  PLAYER_LEVEL_BADGES,
  RECRUITER_PLAYER_LEVEL_FILTERS,
  type PlayerLevelBadge,
  type PlayerLevelId,
  type RecruiterPlayerLevelFilter,
} from '../models/PlayerLevel';
import type { ProductLineId } from '../models/ProductLine';
import type { User } from '../models/User';

/** Défaut : amateur. Signature pro → professional sans changer de coque. */
export function resolvePlayerLevel(
  user: Pick<User, 'player_level' | 'product_line' | 'profile' | 'role'>,
): PlayerLevelId {
  if (user.role !== 'player') return 'amateur';
  if (user.player_level) return user.player_level;

  const line = user.product_line;
  if (line === 'pro_player' || line === 'pro') {
    const level = user.profile?.level?.toLowerCase() ?? '';
    if (
      level.includes('pro') ||
      level.includes('n1') ||
      level.includes('n2') ||
      level.includes('ligue')
    ) {
      return 'professional';
    }
    if (
      level.includes('centre') ||
      level.includes('formation') ||
      level.includes('aspirant') ||
      level.includes('u19') ||
      level.includes('u17')
    ) {
      return 'academy';
    }
    return 'professional';
  }

  const category = user.profile?.category?.toLowerCase() ?? '';
  if (
    category.includes('centre') ||
    category.includes('formation') ||
    category.includes('aspirant')
  ) {
    return 'academy';
  }

  return 'amateur';
}

export function playerLevelBadgeFor(
  user: Pick<User, 'player_level' | 'product_line' | 'profile' | 'role'>,
): PlayerLevelBadge {
  return PLAYER_LEVEL_BADGES[resolvePlayerLevel(user)];
}

/** Passage pro : même profil, badge uniquement. */
export function promotePlayerToProfessional(
  current: PlayerLevelId | undefined,
): PlayerLevelId {
  void current;
  return 'professional';
}

export function playerLevelMatchesFilter(
  level: PlayerLevelId,
  filter: RecruiterPlayerLevelFilter,
): boolean {
  const entry = RECRUITER_PLAYER_LEVEL_FILTERS.find((f) => f.id === filter);
  if (!entry || entry.matches === 'all') return true;
  return entry.matches.includes(level);
}

/** Lignes produit rattachées au Pôle Joueur unifié. */
export function isJoueurProductLine(line: ProductLineId | null | undefined): boolean {
  return (
    line === 'amateur' ||
    line === 'pro_player' ||
    line === 'homme' ||
    line === 'woman'
  );
}
