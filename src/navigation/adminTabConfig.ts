import type { IconName } from '../components/ui/Icon';

export type AdminMainTabId = 'pilotage' | 'users' | 'contenu' | 'clubs' | 'system';

export const ADMIN_TAB_ITEMS: {
  id: AdminMainTabId;
  label: string;
  shortLabel: string;
  icon: IconName;
}[] = [
  { id: 'pilotage', label: 'Pilotage', shortLabel: 'Pilotage', icon: 'home' },
  { id: 'users', label: 'Utilisateurs', shortLabel: 'Users', icon: 'people' },
  { id: 'contenu', label: 'Contenu', shortLabel: 'Contenu', icon: 'calendar' },
  { id: 'clubs', label: 'Clubs', shortLabel: 'Clubs', icon: 'business' },
  { id: 'system', label: 'Système', shortLabel: 'Système', icon: 'settings' },
];

/** Marge bas de page — barre admin */
export const ADMIN_TAB_BAR_INSET = 88;
