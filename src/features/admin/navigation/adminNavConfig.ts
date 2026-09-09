import type { IconName } from '../../../components/ui/iconNames';

/**
 * Bureau Ops — information architecture fondateur.
 * Workflows opérationnels (pas silos Tour/Claims/Menu du dock legacy).
 */

export type AdminNavGroupId = 'desk' | 'directory' | 'live';

export type AdminNavSectionId =
  | 'pulse'
  | 'file'
  | 'annuaire'
  | 'comptes'
  | 'effectifs'
  | 'classements';

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
  { id: 'desk', label: 'Bureau' },
  { id: 'directory', label: 'Répertoire' },
  { id: 'live', label: 'Flux live' },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: 'pulse',
    label: 'Pulse',
    shortLabel: 'Pulse',
    icon: 'flash',
    group: 'desk',
    hint: 'Santé plateforme · file prioritaire',
  },
  {
    id: 'file',
    label: 'File',
    shortLabel: 'File',
    icon: 'shield',
    group: 'desk',
    hint: 'Claims FFF · adhésions · docs ID',
  },
  {
    id: 'annuaire',
    label: 'Annuaire',
    shortLabel: 'Clubs',
    icon: 'business',
    group: 'directory',
    hint: 'CRUD clubs · logos · données publiques',
  },
  {
    id: 'comptes',
    label: 'Comptes',
    shortLabel: 'Comptes',
    icon: 'person',
    group: 'directory',
    hint: 'Comptes · rôles · permissions',
  },
  {
    id: 'effectifs',
    label: 'Effectifs',
    shortLabel: 'Eff.',
    icon: 'people',
    group: 'live',
    hint: 'Rosters FootClubs · force sync',
  },
  {
    id: 'classements',
    label: 'Tableaux',
    shortLabel: 'Tab.',
    icon: 'stats-chart',
    group: 'live',
    hint: 'Classements · sync · override',
  },
];

/** Rail permanent — les 6 zones, aucun overflow « Menu ». */
export const ADMIN_RAIL_IDS: AdminNavSectionId[] = ADMIN_NAV_ITEMS.map((n) => n.id);

/** @deprecated Plus de dock bottom — alias rail pour tests legacy. */
export const ADMIN_PRIMARY_NAV_IDS: AdminNavSectionId[] = ADMIN_RAIL_IDS;

/** @deprecated Plus de menu overflow. */
export const ADMIN_MENU_DEST_IDS: AdminNavSectionId[] = [];

export type AdminNavTarget = {
  section: AdminNavSectionId;
  focusId?: string;
  query?: string;
};

const SECTION_SET = new Set<string>(ADMIN_NAV_ITEMS.map((n) => n.id));

export function isAdminNavSectionId(id: string): id is AdminNavSectionId {
  return SECTION_SET.has(id);
}

export function findAdminNavItem(id: AdminNavSectionId): AdminNavItem | undefined {
  return ADMIN_NAV_ITEMS.find((n) => n.id === id);
}

export function adminNavItemsInGroup(group: AdminNavGroupId): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((n) => n.group === group);
}

/** Legacy Cockpit Total / FOC / Control Center → Bureau Ops. */
const LEGACY_MAP: Record<string, AdminNavTarget> = {
  dashboard: { section: 'pulse' },
  accueil: { section: 'pulse' },
  tour: { section: 'pulse' },
  cockpit: { section: 'pulse' },
  pulse: { section: 'pulse' },
  ia: { section: 'pulse' },
  menu: { section: 'pulse' },
  users: { section: 'comptes' },
  utilisateurs: { section: 'comptes' },
  comptes: { section: 'comptes' },
  personnes: { section: 'comptes' },
  adherents: { section: 'comptes' },
  clubs: { section: 'annuaire' },
  annuaire: { section: 'annuaire' },
  visual: { section: 'annuaire' },
  activite: { section: 'pulse' },
  business: { section: 'pulse' },
  finances: { section: 'pulse' },
  abonnements: { section: 'comptes' },
  commercial: { section: 'pulse' },
  devis: { section: 'annuaire' },
  contenus: { section: 'file' },
  securite: { section: 'file' },
  parametres: { section: 'pulse' },
  systeme: { section: 'pulse' },
  plateforme: { section: 'pulse' },
  produit: { section: 'pulse' },
  support: { section: 'file' },
  donnees: { section: 'effectifs' },
  data: { section: 'effectifs' },
  effectifs: { section: 'effectifs' },
  rosters: { section: 'effectifs' },
  standings: { section: 'classements' },
  classements: { section: 'classements' },
  tableaux: { section: 'classements' },
  claims: { section: 'file' },
  identite: { section: 'file' },
  identity: { section: 'file' },
  file: { section: 'file' },
  pilotage: { section: 'pulse' },
  decisions: { section: 'file' },
  gestion: { section: 'comptes' },
};

export function resolveAdminNav(id: string): AdminNavTarget {
  if (isAdminNavSectionId(id)) {
    return { section: id };
  }
  return LEGACY_MAP[id] ?? { section: 'pulse' };
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
      label: 'Traiter file claims & adhésions',
      section: 'file',
      keywords: ['claim', 'adhésion', 'verify', 'fff', 'pending', 'file'],
    },
    {
      id: 'cmd-standings',
      label: 'Force sync classements',
      section: 'classements',
      keywords: ['fff', 'standings', 'classements', 'r1', 'r2', 'sync', 'tableaux'],
    },
    {
      id: 'cmd-rosters',
      label: 'Force sync effectifs',
      section: 'effectifs',
      keywords: ['roster', 'effectif', 'footclubs', 'sync'],
    },
    {
      id: 'cmd-actions',
      label: 'Actions requises Pulse',
      section: 'pulse',
      keywords: ['todo', 'à faire', 'urgent', 'file', 'queue', 'pulse'],
    },
    {
      id: 'cmd-clubs',
      label: 'Créer / éditer club',
      section: 'annuaire',
      keywords: ['club', 'annuaire', 'crud', 'logo'],
    },
    {
      id: 'cmd-users',
      label: 'Gérer comptes & rôles',
      section: 'comptes',
      keywords: ['user', 'compte', 'role', 'permission'],
    },
  ];
}
