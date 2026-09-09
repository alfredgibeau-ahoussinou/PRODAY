import type { IconName } from '../../../components/ui/iconNames';

/**
 * Cockpit Total — navigation unique du Control Center fondateur.
 * Sections opérationnelles réelles uniquement (pas de silos marketing).
 */

export type AdminNavGroupId = 'tower' | 'ops' | 'people';

export type AdminNavSectionId =
  | 'tour'
  | 'clubs'
  | 'identite'
  | 'effectifs'
  | 'classements'
  | 'utilisateurs'
  | 'menu';

export type AdminNavItem = {
  id: AdminNavSectionId;
  label: string;
  shortLabel: string;
  icon: IconName;
  group: AdminNavGroupId;
  hint?: string;
};

export type AdminNavGroup = {
  id: AdminNavGroupId;
  label: string;
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  { id: 'tower', label: 'Tour de contrôle' },
  { id: 'ops', label: 'Données live' },
  { id: 'people', label: 'Identité' },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: 'tour',
    label: 'Cockpit',
    shortLabel: 'Tour',
    icon: 'home',
    group: 'tower',
    hint: 'Vue d’ensemble · files · sync',
  },
  {
    id: 'clubs',
    label: 'Clubs & Visual',
    shortLabel: 'Clubs',
    icon: 'business',
    group: 'tower',
    hint: 'CRUD clubs · logos · données publiques',
  },
  {
    id: 'identite',
    label: 'Identity & Claims',
    shortLabel: 'Claims',
    icon: 'shield',
    group: 'people',
    hint: 'Claims FFF · adhésions · docs ID',
  },
  {
    id: 'effectifs',
    label: 'Roster & Data',
    shortLabel: 'Rosters',
    icon: 'people',
    group: 'ops',
    hint: 'Effectifs FootClubs · force sync',
  },
  {
    id: 'classements',
    label: 'Standings Override',
    shortLabel: 'Class.',
    icon: 'stats-chart',
    group: 'ops',
    hint: 'Monitor · sync · ajustement manuel',
  },
  {
    id: 'utilisateurs',
    label: 'Users & Roles',
    shortLabel: 'Users',
    icon: 'person',
    group: 'people',
    hint: 'Comptes · rôles · permissions',
  },
];

/** Dock mobile (5 max). */
export const ADMIN_PRIMARY_NAV_IDS: AdminNavSectionId[] = [
  'tour',
  'clubs',
  'identite',
  'utilisateurs',
  'menu',
];

export const ADMIN_MENU_DEST_IDS: AdminNavSectionId[] = [
  'effectifs',
  'classements',
];

export type AdminNavTarget = {
  section: AdminNavSectionId;
  focusId?: string;
  query?: string;
};

const SECTION_SET = new Set<string>(ADMIN_NAV_ITEMS.map((n) => n.id));

export function isAdminNavSectionId(id: string): id is AdminNavSectionId {
  return SECTION_SET.has(id) || id === 'menu';
}

export function findAdminNavItem(id: AdminNavSectionId): AdminNavItem | undefined {
  return ADMIN_NAV_ITEMS.find((n) => n.id === id);
}

export function adminNavItemsInGroup(group: AdminNavGroupId): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((n) => n.group === group);
}

/** Anciens ids Control Center / FOC → Cockpit Total. */
const LEGACY_MAP: Record<string, AdminNavTarget> = {
  dashboard: { section: 'tour' },
  accueil: { section: 'tour' },
  tour: { section: 'tour' },
  cockpit: { section: 'tour' },
  ia: { section: 'tour' },
  users: { section: 'utilisateurs' },
  utilisateurs: { section: 'utilisateurs' },
  personnes: { section: 'utilisateurs' },
  adherents: { section: 'utilisateurs' },
  clubs: { section: 'clubs' },
  visual: { section: 'clubs' },
  activite: { section: 'tour' },
  business: { section: 'tour' },
  finances: { section: 'tour' },
  abonnements: { section: 'utilisateurs' },
  commercial: { section: 'tour' },
  devis: { section: 'tour' },
  contenus: { section: 'identite' },
  securite: { section: 'identite' },
  parametres: { section: 'tour' },
  systeme: { section: 'tour' },
  plateforme: { section: 'tour' },
  produit: { section: 'tour' },
  support: { section: 'identite' },
  donnees: { section: 'effectifs' },
  data: { section: 'effectifs' },
  effectifs: { section: 'effectifs' },
  rosters: { section: 'effectifs' },
  standings: { section: 'classements' },
  classements: { section: 'classements' },
  claims: { section: 'identite' },
  identite: { section: 'identite' },
  identity: { section: 'identite' },
  pilotage: { section: 'tour' },
  decisions: { section: 'identite' },
  gestion: { section: 'utilisateurs' },
};

export function resolveAdminNav(id: string): AdminNavTarget {
  if (isAdminNavSectionId(id) && id !== 'menu') {
    return { section: id };
  }
  return LEGACY_MAP[id] ?? { section: 'tour' };
}

export function resolveAdminCommandItems(): {
  id: string;
  label: string;
  section: AdminNavSectionId;
  keywords: string[];
}[] {
  const base = ADMIN_NAV_ITEMS.map((n) => ({
    id: n.id,
    label: n.label,
    section: n.id,
    keywords: [n.label, n.shortLabel, n.hint ?? '', n.id].join(' ').toLowerCase().split(/\s+/),
  }));
  return [
    ...base,
    {
      id: 'cmd-claims',
      label: 'File claims & adhésions',
      section: 'identite',
      keywords: ['claim', 'adhésion', 'verify', 'fff', 'pending'],
    },
    {
      id: 'cmd-standings',
      label: 'Force sync classements',
      section: 'classements',
      keywords: ['fff', 'standings', 'classements', 'r1', 'r2', 'sync'],
    },
    {
      id: 'cmd-rosters',
      label: 'Force sync effectifs',
      section: 'effectifs',
      keywords: ['roster', 'effectif', 'footclubs', 'sync'],
    },
    {
      id: 'cmd-actions',
      label: 'Actions requises',
      section: 'tour',
      keywords: ['todo', 'à faire', 'urgent', 'file', 'queue'],
    },
  ];
}
