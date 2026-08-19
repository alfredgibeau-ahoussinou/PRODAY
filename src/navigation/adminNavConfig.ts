/**
 * Console admin ProDay — menu groupé (Principal / Administration).
 * Source de vérité navigation. Les écrans FOC restent les cibles.
 */

import type { IconName } from '../components/ui/iconNames';

export type AdminNavGroupId = 'principal' | 'administration';

export type AdminNavSectionId =
  | 'dashboard'
  | 'users'
  | 'clubs'
  | 'coaches'
  | 'players'
  | 'parents'
  | 'teams'
  | 'matchs'
  | 'recrutement'
  | 'ia'
  | 'video'
  | 'abonnements'
  | 'marketplace'
  | 'sponsors'
  | 'contenus'
  | 'messagerie'
  | 'signalements'
  | 'statistiques'
  | 'parametres'
  | 'audit'
  | 'securite'
  | 'config';

export type AdminNavItem = {
  id: AdminNavSectionId;
  label: string;
  short: string;
  icon: IconName;
  group: AdminNavGroupId;
};

export const ADMIN_NAV_GROUPS: { id: AdminNavGroupId; label: string }[] = [
  { id: 'principal', label: 'Principal' },
  { id: 'administration', label: 'Administration' },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { id: 'dashboard', label: 'Accueil', short: 'Accueil', icon: 'home', group: 'principal' },
  { id: 'users', label: 'Utilisateurs', short: 'Users', icon: 'people', group: 'principal' },
  { id: 'clubs', label: 'Clubs', short: 'Clubs', icon: 'business', group: 'principal' },
  { id: 'coaches', label: 'Coachs', short: 'Coachs', icon: 'person', group: 'principal' },
  { id: 'players', label: 'Joueurs', short: 'Joueurs', icon: 'football', group: 'principal' },
  { id: 'parents', label: 'Parents', short: 'Parents', icon: 'people', group: 'principal' },
  { id: 'teams', label: 'Équipes', short: 'Équipes', icon: 'shirt', group: 'principal' },
  { id: 'matchs', label: 'Matchs & Événements', short: 'Matchs', icon: 'calendar', group: 'principal' },
  { id: 'recrutement', label: 'Recrutement', short: 'Recrut.', icon: 'briefcase', group: 'principal' },
  { id: 'ia', label: 'IA ProDay', short: 'IA', icon: 'star-four-points', group: 'principal' },
  { id: 'video', label: 'Vidéo', short: 'Vidéo', icon: 'videocam', group: 'principal' },
  { id: 'abonnements', label: 'Abonnements & Paiements', short: 'Abos', icon: 'star', group: 'principal' },
  { id: 'marketplace', label: 'Marketplace', short: 'Shop', icon: 'bag', group: 'principal' },
  { id: 'sponsors', label: 'Sponsors', short: 'Sponsors', icon: 'handshake', group: 'principal' },
  { id: 'contenus', label: 'Contenus', short: 'Contenus', icon: 'image', group: 'principal' },
  { id: 'messagerie', label: 'Messagerie', short: 'Msgs', icon: 'chat', group: 'principal' },
  { id: 'signalements', label: 'Signalements', short: 'Signal.', icon: 'flag', group: 'principal' },
  { id: 'statistiques', label: 'Statistiques', short: 'Stats', icon: 'stats-chart', group: 'principal' },
  { id: 'parametres', label: 'Paramètres', short: 'Réglages', icon: 'settings', group: 'principal' },
  { id: 'audit', label: 'Journal d’activité', short: 'Journal', icon: 'document', group: 'administration' },
  { id: 'securite', label: 'Sécurité', short: 'Sécu.', icon: 'shield', group: 'administration' },
  { id: 'config', label: 'Configuration plateforme', short: 'Config', icon: 'tune', group: 'administration' },
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

/** Anciens ids 7-sections FOC + feuilles / HQ. */
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
  | 'abonnements';

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
  coaches: { section: 'coaches', screenTab: 'coach' },
  players: { section: 'players', screenTab: 'player' },
  parents: { section: 'parents', screenTab: 'parent' },
  teams: { section: 'teams', screenTab: 'teams' },
  competition: { section: 'matchs' },
  matchs: { section: 'matchs', hubTab: 'matchs' },
  competitions: { section: 'matchs', hubTab: 'competitions' },
  operations: { section: 'contenus' },
  recrutement: { section: 'recrutement' },
  communication: { section: 'contenus' },
  video: { section: 'video' },
  finances: { section: 'abonnements' },
  abonnements: { section: 'abonnements', screenTab: 'vue' },
  marketplace: { section: 'marketplace', screenTab: 'boutique' },
  sponsors: { section: 'sponsors', screenTab: 'sponsors' },
  plateforme: { section: 'parametres' },
  performance: { section: 'statistiques' },
  statistiques: { section: 'statistiques' },
  parametres: { section: 'parametres' },
  adherents: { section: 'users', screenTab: 'all' },
  publications: { section: 'contenus', screenTab: 'fil' },
  decisions: { section: 'users', screenTab: 'decisions' },
  pilotage: { section: 'dashboard' },
  systeme: { section: 'config' },
  gestion: { section: 'users' },
  ia: { section: 'ia' },
  contenus: { section: 'contenus' },
  messagerie: { section: 'messagerie' },
  signalements: { section: 'signalements' },
  audit: { section: 'audit' },
  securite: { section: 'securite' },
  config: { section: 'config' },
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
  'kpis',
  'queue',
  'business',
  'activity',
  'matchs',
] as const;

export type AdminDashboardBlockId = (typeof DEFAULT_ADMIN_DASHBOARD_ORDER)[number];

export const ADMIN_ABONNEMENTS_TABS = [
  { id: 'vue', label: 'Vue' },
  { id: 'demandes', label: 'Demandes' },
  { id: 'comptes', label: 'Comptes Pro' },
  { id: 'paiements', label: 'Paiements' },
  { id: 'boutique', label: 'Boutique' },
  { id: 'sponsors', label: 'Sponsors' },
] as const;
