import type { User } from '../models/User';
import { getMercatoVisibilityChecklist } from '../utils/mercatoVisibilityChecklist';
import { getProfileCompletion } from '../utils/profileCompletion';

export type ProdayBadgeId =
  | 'profile_complete'
  | 'mercato_ready'
  | 'first_application'
  | 'matches_10'
  | 'verified_identity';

export interface ProdayBadge {
  id: ProdayBadgeId;
  label: string;
  description: string;
  unlocked: boolean;
}

export function computePlayerBadges(
  user: User,
  extras?: { applicationsCount?: number; matchesFollowed?: number },
): ProdayBadge[] {
  const completion = getProfileCompletion(user);
  const mercato = getMercatoVisibilityChecklist(user);
  const stats = user.profile.season_stats;
  const matches = stats?.matches ?? 0;

  return [
    {
      id: 'profile_complete',
      label: 'Profil complété',
      description: '80 % du profil renseigné',
      unlocked: completion.percent >= 80,
    },
    {
      id: 'mercato_ready',
      label: 'Prêt Mercato',
      description: 'Checklist visibilité validée',
      unlocked: mercato.isVisibleReady,
    },
    {
      id: 'first_application',
      label: '1ère candidature',
      description: 'Première candidature envoyée',
      unlocked: (extras?.applicationsCount ?? 0) >= 1,
    },
    {
      id: 'matches_10',
      label: '10 matchs',
      description: 'Dix matchs enregistrés en saison',
      unlocked: matches >= 10 || (extras?.matchesFollowed ?? 0) >= 10,
    },
    {
      id: 'verified_identity',
      label: 'Identité vérifiée',
      description: 'Badge profil vérifié',
      unlocked: user.is_verified === true,
    },
  ];
}
