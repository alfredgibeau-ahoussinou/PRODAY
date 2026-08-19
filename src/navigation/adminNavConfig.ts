/**
 * Console admin ProDay — cockpit IA, 9 items max.
 * Source de vérité navigation. Les écrans FOC restent les cibles.
 */

import type { IconName } from '../components/ui/iconNames';

export type AdminNavGroupId = 'intelligence' | 'pilotage' | 'systeme';

export type AdminNavSectionId =
  | 'dashboard'
  | 'ia'
  | 'users'
  | 'clubs'
  | 'activite'
  | 'business'
  | 'contenus'
  | 'securite'
  | 'parametres';

export type AdminNavItem = {
  id: AdminNavSectionId;
  label: string;
  short: string;
  icon: IconName;
  group: AdminNavGroupId;
};

export const ADMIN_NAV_GROUPS: { id: AdminNavGroupId; label: string }[] = [
  { id: 'intelligence', label: 'Intelligence' },
  { id: 'pilotage', label: 'Pilotage' },
  { id: 'systeme', label: 'Système' },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { id: 'dashboard', label: 'Accueil', short: 'Accueil', icon: 'home', group: 'intelligence' },
  { id: 'ia', label: 'IA ProDay', short: 'IA', icon: 'star-four-points', group: 'intelligence' },
  { id: 'users', label: 'Utilisateurs', short: 'Users', icon: 'people', group: 'pilotage' },
  { id: 'clubs', label: 'Clubs', short: 'Clubs', icon: 'business', group: 'pilotage' },
  { id: 'activite', label: 'Activité', short: 'Acti.', icon: 'calendar', group: 'pilotage' },
  { id: 'business', label: 'Business', short: 'Biz', icon: 'stats-chart', group: 'pilotage' },
  { id: 'contenus', label: 'Contenu', short: 'Contenu', icon: 'image', group: 'pilotage' },
  { id: 'securite', label: 'Sécurité', short: 'Sécu.', icon: 'shield', group: 'systeme' },
  { id: 'parametres', label: 'Paramètres', short: 'Réglages', icon: 'settings', group: 'systeme' },
];

export const ADMIN_NAV_SECTION_IDS = ADMIN_NAV_ITEMS.map((n) => n.id);

const SECTION_SET = new Set<string>(ADMIN_NAV_SECTION_IDS);

export function isAdminNavSectionId(id: string): id is AdminNavSectionId {
  return SECTION_SET.has(id);
}

export function adminNavItemById(id: AdminNavSectionId): AdminNavItem | undefined {
  return ADMIN_NAV_ITEMS.find((n) => n.id === id);
}

export function adminNavItemsInGroup(group: AdminNavGroupId): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((n) => n.group === group);
}

/** Anciens ids 7-sections FOC + menu 22 + feuilles / HQ. */
export type AdminNavLegacyId =
  | 'personnes'
  | 'competition'
  | 'operations'
  | 'finances'
  | 'plateforme'
  | 'adherents'
  | 'matchs'
  | 'competitions'
  | 'recrutement'
  | 'performance'
  | 'communication'
  | 'video'
  | 'parametres'
  | 'coaches'
  | 'publications'
  | 'decisions'
  | 'pilotage'
  | 'gestion'
  | 'systeme'
  | 'abonnements'
  | 'players'
  | 'parents'
  | 'teams'
  | 'marketplace'
  | 'sponsors'
  | 'messagerie'
  | 'signalements'
  | 'statistiques'
  | 'audit'
  | 'config'
  | 'ia';

export type AdminNavTarget = {
  section: AdminNavSectionId;
  hubTab?: string;
  screenTab?: string;
  focusId?: string;
};

const LEGACY_TO_NAV: Record<string, AdminNavTarget> = {
  dashboard: { section: 'dashboard' },
  personnes: { section: 'users' },
  users: { section: 'users' },
  clubs: { section: 'clubs' },
  coaches: { section: 'users', screenTab: 'coach' },
  players: { section: 'users', screenTab: 'player' },
  parents: { section: 'users', screenTab: 'parent' },
  teams: { section: 'clubs', screenTab: 'teams' },
  competition: { section: 'activite' },
  matchs: { section: 'activite', hubTab: 'matchs' },
  competitions: { section: 'activite', hubTab: 'evenements' },
  operations: { section: 'contenus' },
  recrutement: { section: 'clubs', screenTab: 'recrutement' },
  communication: { section: 'contenus' },
  video: { section: 'activite', hubTab: 'video' },
  finances: { section: 'business' },
  abonnements: { section: 'business', screenTab: 'abonnements' },
  marketplace: { section: 'business', screenTab: 'boutique' },
  sponsors: { section: 'business', screenTab: 'sponsors' },
  plateforme: { section: 'parametres' },
  performance: { section: 'business', screenTab: 'vue' },
  statistiques: { section: 'business', screenTab: 'vue' },
  parametres: { section: 'parametres' },
  adherents: { section: 'users', screenTab: 'all' },
  publications: { section: 'contenus', screenTab: 'fil' },
  decisions: { section: 'contenus', screenTab: 'decisions' },
  pilotage: { section: 'dashboard' },
  systeme: { section: 'parametres', screenTab: 'systeme' },
  gestion: { section: 'users' },
  ia: { section: 'ia' },
  contenus: { section: 'contenus' },
  messagerie: { section: 'contenus', screenTab: 'messages' },
  signalements: { section: 'contenus', screenTab: 'signalements' },
  audit: { section: 'securite', screenTab: 'audit' },
  securite: { section: 'securite' },
  config: { section: 'parametres', screenTab: 'config' },
  activite: { section: 'activite' },
  business: { section: 'business' },
};

export function resolveAdminNav(target: string): AdminNavTarget {
  if (isAdminNavSectionId(target) && !LEGACY_TO_NAV[target]?.hubTab && !LEGACY_TO_NAV[target]?.screenTab) {
    return { section: target };
  }
  const mapped = LEGACY_TO_NAV[target];
  if (mapped) return { ...mapped };
  if (isAdminNavSectionId(target)) return { section: target };
  return { section: 'dashboard' };
}

export function migrateAdminNavSectionId(id: string): AdminNavSectionId {
  return resolveAdminNav(id).section;
}

export const ADMIN_NAV_SIDEBAR_WIDTH = 268;
export const ADMIN_NAV_SIDEBAR_COLLAPSED = 76;
export const ADMIN_NAV_TOPBAR_HEIGHT = 56;
export const ADMIN_NAV_DESKTOP_BREAKPOINT = 1024;
export const ADMIN_NAV_TABLET_BREAKPOINT = 768;

export const DEFAULT_ADMIN_DASHBOARD_ORDER = [
  'attention',
  'queue',
  'domains',
  'activity',
] as const;

export type AdminDashboardBlockId = (typeof DEFAULT_ADMIN_DASHBOARD_ORDER)[number];

export const ADMIN_ABONNEMENTS_TABS = [
  { id: 'vue', label: 'Vue' },
  { id: 'abonnements', label: 'Abonnements' },
  { id: 'paiements', label: 'Paiements' },
  { id: 'boutique', label: 'Boutique' },
  { id: 'sponsors', label: 'Sponsors' },
] as const;

export const ADMIN_IA_TABS = [
  { id: 'alertes', label: 'Alertes' },
  { id: 'chat', label: 'Chat' },
  { id: 'automations', label: 'Automatisations' },
] as const;

export const ADMIN_SECURITE_TABS = [
  { id: 'audit', label: 'Audit' },
  { id: 'session', label: 'Session' },
  { id: 'signalements', label: 'Signalements' },
] as const;
