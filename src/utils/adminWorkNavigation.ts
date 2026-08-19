import {
  resolveAdminNav,
  type AdminNavSectionId,
  type AdminNavTarget,
} from '../navigation/adminNavConfig';
import type { AdminWorkItem, GlobalSearchResult } from './adminInsights';

export type AdminFocNavigationTarget = AdminNavTarget;

/** Mappe un item de la file de décisions vers la section / onglets admin. */
export function resolveAdminWorkItemNavigation(item: AdminWorkItem): AdminFocNavigationTarget {
  switch (item.kind) {
    case 'verification':
      return { section: 'users', screenTab: 'decisions' };
    case 'reel':
      return { section: 'contenus', screenTab: 'fil' };
    case 'report':
      return { section: 'signalements' };
    case 'payment':
      return { section: 'abonnements', screenTab: 'paiements' };
    case 'application':
      return { section: 'recrutement', screenTab: 'apps' };
    case 'quote':
      return { section: 'sponsors', screenTab: 'sponsors' };
    case 'post':
      return { section: 'recrutement', screenTab: 'posts' };
    case 'membership':
      return { section: 'clubs', screenTab: 'clubs' };
    case 'subscription_request':
      return { section: 'abonnements', screenTab: 'demandes' };
    default:
      return resolveAdminNav('signalements');
  }
}

/** Mappe un hit de recherche globale vers la section admin. */
export function resolveAdminSearchHitNavigation(hit: GlobalSearchResult): AdminFocNavigationTarget {
  switch (hit.kind) {
    case 'user':
      return { section: 'users', focusId: hit.id };
    case 'club':
      return { section: 'clubs', screenTab: 'clubs', focusId: hit.id };
    case 'post':
      return { section: 'recrutement', screenTab: 'posts' };
    case 'event':
      return { section: 'matchs', hubTab: 'competitions', screenTab: 'events' };
    default:
      return { section: 'dashboard' };
  }
}
