import type { IconName } from '../../../components/ui/Icon';

/** Onglets primaires du dock Parent — miroir Coach (5 slots). */
export type ParentPrimaryTabId = 'home' | 'enfant' | 'guide' | 'plus' | 'reglages';

/** Destinations secondaires (hub Menu). */
export type ParentToolId = 'messages' | 'agenda' | 'trajet';

export type ParentTabId = ParentPrimaryTabId | ParentToolId;

export type ParentNavItem = {
  id: ParentPrimaryTabId;
  label: string;
  shortLabel: string;
  icon: IconName;
};

export type ParentToolItem = {
  id: ParentToolId;
  label: string;
  hint: string;
  icon: IconName;
};

export const PARENT_PRIMARY_TABS: ParentNavItem[] = [
  { id: 'home', label: 'Accueil', shortLabel: 'Accueil', icon: 'home' },
  { id: 'enfant', label: 'Enfant', shortLabel: 'Enfant', icon: 'person' },
  { id: 'guide', label: 'Guide IA', shortLabel: 'Guide', icon: 'star-four-points' },
  { id: 'plus', label: 'Menu', shortLabel: 'Menu', icon: 'menu' },
  { id: 'reglages', label: 'Profil', shortLabel: 'Profil', icon: 'settings' },
];

export const PARENT_MENU_TOOLS: ParentToolItem[] = [
  {
    id: 'messages',
    label: 'Messages',
    hint: 'Contacts & fils de l’enfant',
    icon: 'chat',
  },
  {
    id: 'agenda',
    label: 'Agenda',
    hint: 'Présence Je viens / Absent · retards',
    icon: 'calendar',
  },
  {
    id: 'trajet',
    label: 'Trajet',
    hint: 'Suivi live si le partage est activé',
    icon: 'car',
  },
];

export const PARENT_PRIMARY_IDS: ParentPrimaryTabId[] = PARENT_PRIMARY_TABS.map(
  (t) => t.id,
);

export function isParentPrimaryTab(id: ParentTabId): id is ParentPrimaryTabId {
  return (PARENT_PRIMARY_IDS as string[]).includes(id);
}

/** Onglet dock à allumer (outils secondaires → Menu). */
export function primaryTabForParentNav(id: ParentTabId): ParentPrimaryTabId {
  if (isParentPrimaryTab(id)) return id;
  return 'plus';
}

export function canonicalizeParentNav(id: ParentTabId | 'profil'): ParentTabId {
  if (id === 'profil') return 'enfant';
  return id;
}
