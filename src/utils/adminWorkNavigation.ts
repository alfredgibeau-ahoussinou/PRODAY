import {
  resolveAdminNav,
  type AdminNavTarget,
} from '../navigation/adminNavConfig';
import type { AdminWorkItem, GlobalSearchResult } from './adminInsights';
import { detectAdminCopilotIntent } from './adminCopilot';

export type AdminFocNavigationTarget = AdminNavTarget;

/** Mappe un item de la file de décisions vers la section / onglets admin. */
export function resolveAdminWorkItemNavigation(item: AdminWorkItem): AdminFocNavigationTarget {
  switch (item.kind) {
    case 'verification':
      return { section: 'users', screenTab: 'decisions' };
    case 'reel':
      return { section: 'contenus', screenTab: 'fil' };
    case 'report':
      return { section: 'contenus', screenTab: 'signalements' };
    case 'payment':
      return { section: 'business', screenTab: 'paiements' };
    case 'application':
      return { section: 'clubs', screenTab: 'apps' };
    case 'quote':
      return { section: 'business', screenTab: 'sponsors' };
    case 'post':
      return { section: 'clubs', screenTab: 'posts' };
    case 'membership':
      return { section: 'clubs', screenTab: 'validation' };
    case 'subscription_request':
      return { section: 'business', screenTab: 'abonnements' };
    default:
      return resolveAdminNav('contenus');
  }
}

/** Mappe un hit de recherche globale vers la section admin. */
export function resolveAdminSearchHitNavigation(hit: GlobalSearchResult): AdminFocNavigationTarget {
  switch (hit.kind) {
    case 'user':
      return { section: 'users', focusId: hit.entityId ?? hit.id };
    case 'club':
      return { section: 'clubs', screenTab: 'all', focusId: hit.entityId ?? hit.id };
    case 'post':
      return { section: 'clubs', screenTab: 'posts' };
    case 'event':
      return { section: 'activite', hubTab: 'evenements', screenTab: 'events' };
    default:
      return { section: 'dashboard' };
  }
}

const COPILOT_SHORT_QUERIES = [
  'clubs inactifs',
  'paiements échoués',
  'paiements echoues',
  'file',
  'priorités',
  'priorites',
];

/** Questions courtes → moteur copilote plutôt que recherche d’entité. */
export function isAdminCopilotShortQuery(query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return false;
  if (COPILOT_SHORT_QUERIES.some((s) => q.includes(s) || s.includes(q))) return true;
  const intent = detectAdminCopilotIntent(q);
  return intent !== 'unknown';
}
