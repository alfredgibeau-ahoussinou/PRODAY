import type { User } from '../models/User';
import { isPlatformAdminEmail } from '../config/admin';
import { userNeedsAdminVerificationReview } from './adminUserVerification';
import { isSubscriptionAccessActive } from './subscriptionLogic';
import {
  adminPlayerIdentityLine,
  resolveAdminPlayerAgeGroup,
  type AdminEditableGender,
} from './adminPlayerUniverse';
import type { JoueurAgeGroup } from './joueurExperienceTheme';

/** Onglets primaires Personnes (sans univers âge — déplacés en filtres avancés). */
export type AdminPersonTabId =
  | 'all'
  | 'decisions'
  | 'player'
  | 'coach'
  | 'parent'
  | 'club'
  | 'admin';

export type AdminPersonAgeFilter = 'all' | JoueurAgeGroup;
export type AdminPersonGenderFilter = 'all' | AdminEditableGender;
export type AdminPersonSubscriptionFilter = 'all' | 'free' | 'paid';

export const ADMIN_PERSON_PRIMARY_TABS: { id: AdminPersonTabId; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'player', label: 'Joueurs' },
  { id: 'coach', label: 'Coachs' },
  { id: 'parent', label: 'Parents' },
  { id: 'admin', label: 'Admins' },
];

const LEGACY_AGE_TABS = new Set<string>(['youth', 'teen', 'adult']);

export function resolveAdminPersonInitialTab(initialTab?: string): {
  tab: AdminPersonTabId;
  ageFilter: AdminPersonAgeFilter;
} {
  if (initialTab && LEGACY_AGE_TABS.has(initialTab)) {
    return { tab: 'player', ageFilter: initialTab as JoueurAgeGroup };
  }
  if (initialTab && ADMIN_PERSON_PRIMARY_TABS.some((t) => t.id === initialTab)) {
    return { tab: initialTab as AdminPersonTabId, ageFilter: 'all' };
  }
  return { tab: 'all', ageFilter: 'all' };
}

export function filterAdminPersons(
  users: User[],
  tab: AdminPersonTabId,
  query: string,
  ageFilter: AdminPersonAgeFilter,
  genderFilter: AdminPersonGenderFilter,
  subscriptionFilter: AdminPersonSubscriptionFilter,
): User[] {
  const q = query.trim().toLowerCase();
  let list = users;

  if (tab === 'player') list = list.filter((u) => u.role === 'player');
  else if (tab === 'parent') list = list.filter((u) => u.role === 'parent');
  else if (tab === 'coach') list = list.filter((u) => u.role === 'coach');
  else if (tab === 'club') list = list.filter((u) => u.role === 'club');
  else if (tab === 'admin') list = list.filter((u) => isPlatformAdminEmail(u.email));
  else if (tab === 'decisions') list = list.filter(userNeedsAdminVerificationReview);

  if (ageFilter !== 'all') {
    list = list.filter(
      (u) => u.role === 'player' && resolveAdminPlayerAgeGroup(u) === ageFilter,
    );
  }
  if (genderFilter !== 'all') {
    list = list.filter((u) => u.profile?.gender === genderFilter);
  }
  if (subscriptionFilter === 'paid') {
    list = list.filter((u) => isSubscriptionAccessActive(u));
  } else if (subscriptionFilter === 'free') {
    list = list.filter((u) => !isSubscriptionAccessActive(u));
  }

  if (q) {
    list = list.filter((u) => {
      const identity = adminPlayerIdentityLine(u)?.toLowerCase() ?? '';
      return (
        u.display_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.city?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q) ||
        identity.includes(q)
      );
    });
  }
  return list;
}

export function countAdminPersonPending(users: User[]): number {
  return users.filter(userNeedsAdminVerificationReview).length;
}

export function adminPersonAdvancedFiltersActive(
  ageFilter: AdminPersonAgeFilter,
  genderFilter: AdminPersonGenderFilter,
  subscriptionFilter: AdminPersonSubscriptionFilter,
): boolean {
  return ageFilter !== 'all' || genderFilter !== 'all' || subscriptionFilter !== 'all';
}

export function adminPersonShowPlayerFilters(tab: AdminPersonTabId): boolean {
  return tab === 'all' || tab === 'player';
}
