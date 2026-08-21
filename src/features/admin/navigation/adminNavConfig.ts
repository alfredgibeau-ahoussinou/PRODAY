import type { IconName } from '../../../components/ui/iconNames';

/**
 * Navigation Admin Control Center — domaines opérationnels.
 * Desktop : sidebar par groupes · Mobile : dock + Menu.
 */

export type AdminNavGroupId =
  | 'command'
  | 'people'
  | 'growth'
  | 'ops'
  | 'system';

export type AdminNavSectionId =
  | 'accueil'
  | 'plateforme'
  | 'utilisateurs'
  | 'clubs'
  | 'commercial'
  | 'finances'
  | 'produit'
  | 'ia'
  | 'support'
  | 'securite'
  | 'systeme'
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
  { id: 'command', label: 'Commande' },
  { id: 'people', label: 'Écosystème' },
  { id: 'growth', label: 'Commercial' },
  { id: 'ops', label: 'Opérations' },
  { id: 'system', label: 'Système' },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: 'accueil',
    label: 'Accueil',
    shortLabel: 'Accueil',
    icon: 'home',
    group: 'command',
    hint: 'Que se passe-t-il maintenant',
  },
  {
    id: 'plateforme',
    label: 'Plateforme',
    shortLabel: 'Plateforme',
    icon: 'stats-chart',
    group: 'command',
    hint: 'Santé & activité globale',
  },
  {
    id: 'utilisateurs',
    label: 'Utilisateurs',
    shortLabel: 'Users',
    icon: 'people',
    group: 'people',
  },
  {
    id: 'clubs',
    label: 'Clubs',
    shortLabel: 'Clubs',
    icon: 'business',
    group: 'people',
  },
  {
    id: 'commercial',
    label: 'Commercial',
    shortLabel: 'Devis',
    icon: 'document',
    group: 'growth',
    hint: 'Prospects, devis, CRM',
  },
  {
    id: 'finances',
    label: 'Finances',
    shortLabel: 'Finance',
    icon: 'bag',
    group: 'growth',
  },
  {
    id: 'produit',
    label: 'Produit',
    shortLabel: 'Produit',
    icon: 'tune',
    group: 'ops',
  },
  {
    id: 'ia',
    label: 'Admin AI',
    shortLabel: 'IA',
    icon: 'star-four-points',
    group: 'ops',
  },
  {
    id: 'support',
    label: 'Support',
    shortLabel: 'Support',
    icon: 'chat',
    group: 'ops',
  },
  {
    id: 'securite',
    label: 'Sécurité',
    shortLabel: 'Sécu.',
    icon: 'shield',
    group: 'system',
  },
  {
    id: 'systeme',
    label: 'Système',
    shortLabel: 'Système',
    icon: 'settings',
    group: 'system',
  },
];

/** Dock mobile (5 max). */
export const ADMIN_PRIMARY_NAV_IDS: AdminNavSectionId[] = [
  'accueil',
  'commercial',
  'clubs',
  'menu',
  'ia',
];

export const ADMIN_MENU_DEST_IDS: AdminNavSectionId[] = [
  'plateforme',
  'utilisateurs',
  'finances',
  'produit',
  'support',
  'securite',
  'systeme',
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

/** Anciens ids FOC / HQ → nouvelle navigation. */
const LEGACY_MAP: Record<string, AdminNavTarget> = {
  dashboard: { section: 'accueil' },
  accueil: { section: 'accueil' },
  ia: { section: 'ia' },
  users: { section: 'utilisateurs' },
  utilisateurs: { section: 'utilisateurs' },
  personnes: { section: 'utilisateurs' },
  adherents: { section: 'utilisateurs' },
  clubs: { section: 'clubs' },
  activite: { section: 'plateforme' },
  business: { section: 'finances' },
  finances: { section: 'finances' },
  abonnements: { section: 'finances' },
  commercial: { section: 'commercial' },
  devis: { section: 'commercial' },
  contenus: { section: 'support' },
  securite: { section: 'securite' },
  parametres: { section: 'systeme' },
  systeme: { section: 'systeme' },
  plateforme: { section: 'plateforme' },
  produit: { section: 'produit' },
  support: { section: 'support' },
  pilotage: { section: 'accueil' },
  decisions: { section: 'support' },
  gestion: { section: 'utilisateurs' },
};

export function resolveAdminNav(id: string): AdminNavTarget {
  if (isAdminNavSectionId(id) && id !== 'menu') {
    return { section: id };
  }
  return LEGACY_MAP[id] ?? { section: 'accueil' };
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
      id: 'cmd-quote',
      label: 'Nouveau devis / demandes',
      section: 'commercial',
      keywords: ['devis', 'quote', 'prospect', 'crm'],
    },
    {
      id: 'cmd-health',
      label: 'Santé ProDay',
      section: 'plateforme',
      keywords: ['health', 'santé', 'erreurs', 'api'],
    },
    {
      id: 'cmd-actions',
      label: 'Actions requises',
      section: 'accueil',
      keywords: ['todo', 'à faire', 'urgent', 'file'],
    },
  ];
}
