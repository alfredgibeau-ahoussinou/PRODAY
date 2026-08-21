import type { AdminNavTarget } from '../features/admin/navigation/adminNavConfig';
import { resolveAdminNav } from '../features/admin/navigation/adminNavConfig';
import type { AdminWorkItem, GlobalSearchResult } from './adminInsights';

export function resolveAdminWorkItemNavigation(item: AdminWorkItem): AdminNavTarget {
  return {
    section: item.targetSection,
    focusId: item.entityId,
  };
}

export function resolveAdminSearchHitNavigation(hit: GlobalSearchResult): AdminNavTarget {
  return {
    section: hit.targetSection,
    focusId: hit.entityId ?? hit.id,
    query: hit.focusQuery,
  };
}

export function isAdminCopilotShortQuery(query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return false;
  const keys = [
    'clubs inactifs',
    'paiements',
    'file',
    'priorités',
    'priorites',
    'devis',
    'santé',
    'sante',
    'mrr',
    'ca',
  ];
  return keys.some((s) => q.includes(s));
}

export function resolveAdminQuickPath(raw: string): AdminNavTarget {
  return resolveAdminNav(raw);
}
