import type { IconName } from '../../../components/ui/iconNames';
import type { ClubNavItemId } from '../../club/navigation/clubNavConfig';

/**
 * Navigation Pôle Président — cockpit directionnel.
 * Desktop : sidebar catégories · Mobile : dock + Menu.
 */

export type PresidentNavFolderId =
  | 'cockpit'
  | 'pilotage'
  | 'ressources'
  | 'analyses'
  | 'ia'
  | 'parametres';

export type PresidentNavItemId =
  | 'cockpit'
  | 'overview'
  | 'sport'
  | 'finance'
  | 'members'
  | 'teams'
  | 'staff'
  | 'sponsors'
  | 'communication'
  | 'events'
  | 'documents'
  | 'reports'
  | 'insights'
  | 'ai'
  | 'settings'
  | 'board'
  | 'season'
  | 'goals'
  | 'alerts'
  | 'menu';

export type PresidentNavItem = {
  id: PresidentNavItemId;
  label: string;
  shortLabel?: string;
  icon: IconName;
  hint?: string;
  /** Deep-link vers un écran Club pour piloter (pas de CRUD ici). */
  clubDeepLink?: ClubNavItemId;
};

export type PresidentNavFolder = {
  id: PresidentNavFolderId;
  label: string;
  items: PresidentNavItem[];
};

/** Dock mobile (5 max) — le reste via Menu. */
export const PRESIDENT_PRIMARY_NAV_IDS: PresidentNavItemId[] = [
  'cockpit',
  'overview',
  'finance',
  'menu',
  'ai',
];

export const PRESIDENT_MENU_DEST_IDS: PresidentNavItemId[] = [
  'sport',
  'members',
  'teams',
  'staff',
  'sponsors',
  'communication',
  'events',
  'documents',
  'reports',
  'insights',
  'board',
  'season',
  'goals',
  'alerts',
  'settings',
];

export const PRESIDENT_NAV_FOLDERS: PresidentNavFolder[] = [
  {
    id: 'cockpit',
    label: 'Cockpit',
    items: [
      {
        id: 'cockpit',
        label: 'Accueil',
        shortLabel: 'Cockpit',
        icon: 'home',
        hint: 'État du club',
      },
      {
        id: 'overview',
        label: 'Mon club',
        shortLabel: 'Club',
        icon: 'football',
        hint: 'Vue d’ensemble',
        clubDeepLink: 'club',
      },
      {
        id: 'alerts',
        label: 'Alertes',
        shortLabel: 'Alertes',
        icon: 'notifications',
        hint: 'Signaux prioritaires',
      },
    ],
  },
  {
    id: 'pilotage',
    label: 'Pilotage',
    items: [
      {
        id: 'sport',
        label: 'Sportif',
        icon: 'trophy',
        hint: 'Matchs & saisons',
        clubDeepLink: 'matches',
      },
      {
        id: 'finance',
        label: 'Finances',
        icon: 'stats-chart',
        hint: 'Budget & cotisations',
        clubDeepLink: 'finances',
      },
      {
        id: 'members',
        label: 'Adhérents',
        icon: 'people',
        hint: 'Licenciés & validations',
        clubDeepLink: 'players',
      },
      {
        id: 'teams',
        label: 'Équipes',
        icon: 'football',
        hint: 'Structure sportive',
        clubDeepLink: 'teams',
      },
      {
        id: 'staff',
        label: 'Coachs',
        icon: 'school',
        hint: 'Staff sportif',
        clubDeepLink: 'coaches',
      },
      {
        id: 'sponsors',
        label: 'Sponsors',
        icon: 'briefcase',
        hint: 'Partenaires',
        clubDeepLink: 'sponsoring',
      },
      {
        id: 'communication',
        label: 'Communication',
        icon: 'chat',
        hint: 'Annonces & messages',
        clubDeepLink: 'communication',
      },
      {
        id: 'events',
        label: 'Événements',
        icon: 'calendar',
        hint: 'Agenda club',
        clubDeepLink: 'events',
      },
    ],
  },
  {
    id: 'ressources',
    label: 'Ressources',
    items: [
      {
        id: 'documents',
        label: 'Documents',
        icon: 'document',
        hint: 'Bureau & archives',
      },
      {
        id: 'board',
        label: 'Comité',
        icon: 'people',
        hint: 'Bureau dirigeant',
      },
      {
        id: 'season',
        label: 'Saison',
        icon: 'calendar',
        hint: 'Calendrier stratégique',
        clubDeepLink: 'calendar',
      },
      {
        id: 'goals',
        label: 'Objectifs',
        icon: 'flag',
        hint: 'Cibles direction',
      },
    ],
  },
  {
    id: 'analyses',
    label: 'Analyses',
    items: [
      {
        id: 'insights',
        label: 'Analyses',
        icon: 'stats-chart',
        hint: 'Indicateurs',
        clubDeepLink: 'stats',
      },
      {
        id: 'reports',
        label: 'Rapports',
        icon: 'document',
        hint: 'Synthèses exportables',
      },
    ],
  },
  {
    id: 'ia',
    label: 'IA',
    items: [
      {
        id: 'ai',
        label: 'Assistant',
        shortLabel: 'IA',
        icon: 'star-four-points',
        hint: 'Conseil exécutif',
      },
    ],
  },
  {
    id: 'parametres',
    label: 'Paramètres',
    items: [
      {
        id: 'settings',
        label: 'Paramètres',
        shortLabel: 'Réglages',
        icon: 'settings',
        hint: 'Pôle & retour Club',
        clubDeepLink: 'permissions',
      },
    ],
  },
];

export const PRESIDENT_NAV_CATALOG: PresidentNavItem[] = PRESIDENT_NAV_FOLDERS.flatMap(
  (f) => f.items,
);

export function findPresidentNavItem(id: PresidentNavItemId): PresidentNavItem | undefined {
  return PRESIDENT_NAV_CATALOG.find((i) => i.id === id);
}

export function canonicalizePresidentNav(id: PresidentNavItemId): PresidentNavItemId {
  if (id === 'menu') return 'cockpit';
  return id;
}

/** Mapping indicateur santé → section. */
export type PresidentHealthAxisId =
  | 'sport'
  | 'finance'
  | 'admin'
  | 'human'
  | 'growth';

export const PRESIDENT_HEALTH_AXIS_NAV: Record<PresidentHealthAxisId, PresidentNavItemId> = {
  sport: 'sport',
  finance: 'finance',
  admin: 'members',
  human: 'staff',
  growth: 'sponsors',
};
