import {
  resolveAdminFocNavigation,
  type AdminFocSectionId,
} from '../navigation/adminFocConfig';
import type { AdminWorkItem } from './adminInsights';

export type AdminFocNavigationTarget = {
  section: AdminFocSectionId;
  hubTab?: string;
  screenTab?: string;
};

/** Mappe un item de la file de décisions vers la section / onglets FOC. */
export function resolveAdminWorkItemNavigation(item: AdminWorkItem): AdminFocNavigationTarget {
  switch (item.kind) {
    case 'verification':
      return { section: 'personnes', screenTab: 'decisions' };
    case 'reel':
    case 'report':
      return { section: 'operations', hubTab: 'communication', screenTab: 'decisions' };
    case 'payment':
      return { section: 'finances', screenTab: 'paiements' };
    case 'application':
      return { section: 'operations', hubTab: 'recrutement', screenTab: 'candidatures' };
    case 'quote':
      return { section: 'finances', screenTab: 'sponsors' };
    case 'post':
      return { section: 'operations', hubTab: 'communication', screenTab: 'annonces' };
    default:
      return resolveAdminFocNavigation('communication');
  }
}
