/**
 * Compat FOC → nouveau registre `adminNavConfig`.
 * Les écrans existants importent encore ce module (onglets in-page, deep links).
 */

import {
  ADMIN_NAV_ITEMS,
  ADMIN_NAV_SIDEBAR_COLLAPSED,
  ADMIN_NAV_SIDEBAR_WIDTH,
  ADMIN_NAV_TOPBAR_HEIGHT,
  DEFAULT_ADMIN_DASHBOARD_ORDER,
  isAdminNavSectionId,
  migrateAdminNavSectionId,
  resolveAdminNav,
  type AdminDashboardBlockId,
  type AdminNavSectionId,
} from './adminNavConfig';

export type AdminFocSectionId = AdminNavSectionId;

export type AdminFocLegacySectionId =
  | 'adherents'
  | 'matchs'
  | 'competitions'
  | 'recrutement'
  | 'performance'
  | 'communication'
  | 'video'
  | 'parametres'
  | 'personnes'
  | 'competition'
  | 'operations'
  | 'finances'
  | 'plateforme';

export type AdminFocNavItem = {
  id: AdminFocSectionId;
  label: string;
  short: string;
  icon: (typeof ADMIN_NAV_ITEMS)[number]['icon'];
};

export const ADMIN_FOC_NAV: AdminFocNavItem[] = ADMIN_NAV_ITEMS.map((n) => ({
  id: n.id,
  label: n.label,
  short: n.short,
  icon: n.icon,
}));

/** Onglets in-page des hubs / feuilles (pas le menu sidebar). */
export const ADMIN_FOC_TABS: Record<string, { id: string; label: string }[]> = {
  dashboard: [{ id: 'overview', label: 'Vue d’ensemble' }],
  users: [
    { id: 'all', label: 'Tous' },
    { id: 'decisions', label: 'À valider' },
    { id: 'player', label: 'Joueurs' },
    { id: 'coach', label: 'Coachs' },
    { id: 'parent', label: 'Parents' },
    { id: 'club', label: 'Dirigeants' },
  ],
  personnes: [
    { id: 'all', label: 'Tous' },
    { id: 'decisions', label: 'À valider' },
    { id: 'player', label: 'Joueurs' },
    { id: 'coach', label: 'Coachs' },
    { id: 'parent', label: 'Parents' },
    { id: 'club', label: 'Dirigeants' },
  ],
  clubs: [
    { id: 'clubs', label: 'Clubs' },
    { id: 'teams', label: 'Équipes' },
  ],
  matchs: [
    { id: 'matchs', label: 'Matchs' },
    { id: 'competitions', label: 'Événements' },
  ],
  competition: [
    { id: 'matchs', label: 'Matchs' },
    { id: 'competitions', label: 'Compétitions' },
  ],
  abonnements: [
    { id: 'vue', label: 'Vue' },
    { id: 'demandes', label: 'Demandes' },
    { id: 'comptes', label: 'Comptes Pro' },
    { id: 'paiements', label: 'Paiements' },
    { id: 'boutique', label: 'Boutique' },
    { id: 'sponsors', label: 'Sponsors' },
  ],
  finances: [
    { id: 'vue', label: 'Vue' },
    { id: 'demandes', label: 'Demandes' },
    { id: 'comptes', label: 'Comptes Pro' },
    { id: 'paiements', label: 'Paiements' },
    { id: 'boutique', label: 'Boutique' },
    { id: 'sponsors', label: 'Sponsors' },
  ],
};

export const ADMIN_FOC_SCREEN_TABS = {
  matchs: [
    { id: 'all', label: 'Calendrier' },
    { id: 'upcoming', label: 'À venir' },
    { id: 'done', label: 'Résultats' },
    { id: 'invites', label: 'Invitations' },
  ],
  competitions: [
    { id: 'events', label: 'Événements' },
    { id: 'tournaments', label: 'Tournois' },
  ],
  recrutement: [
    { id: 'bassin', label: 'Bassin' },
    { id: 'posts', label: 'Annonces' },
    { id: 'apps', label: 'Candidatures' },
    { id: 'players', label: 'Joueurs' },
  ],
  performance: [
    { id: 'stats', label: 'Statistiques' },
    { id: 'traffic', label: 'Trafic' },
  ],
  communication: [
    { id: 'decisions', label: 'Décisions' },
    { id: 'messages', label: 'Messages' },
    { id: 'annonces', label: 'Annonces' },
    { id: 'fil', label: 'Fil plateforme' },
    { id: 'questions', label: 'Question semaine' },
  ],
  contenus: [
    { id: 'annonces', label: 'Annonces' },
    { id: 'fil', label: 'Fil plateforme' },
    { id: 'questions', label: 'Question semaine' },
  ],
  parametres: [
    { id: 'personnaliser', label: 'Personnaliser' },
    { id: 'systeme', label: 'Système' },
    { id: 'audit', label: 'Audit' },
    { id: 'beta', label: 'Bêta' },
  ],
} as const;

export const ADMIN_FOC_LEGACY_SECTION_MAP: Record<AdminFocLegacySectionId, AdminFocSectionId> = {
  adherents: 'users',
  matchs: 'matchs',
  competitions: 'matchs',
  recrutement: 'recrutement',
  communication: 'contenus',
  video: 'video',
  performance: 'statistiques',
  parametres: 'parametres',
  personnes: 'users',
  competition: 'matchs',
  operations: 'contenus',
  finances: 'abonnements',
  plateforme: 'parametres',
};

export const ADMIN_FOC_LEGACY_HUB_TAB: Partial<Record<AdminFocLegacySectionId, string>> = {
  matchs: 'matchs',
  competitions: 'competitions',
};

export type AdminFocDeepLinkId =
  | AdminFocLegacySectionId
  | 'coaches'
  | 'publications'
  | 'decisions';

export const ADMIN_FOC_LEGACY_SCREEN_TAB: Partial<Record<AdminFocDeepLinkId, string>> = {
  adherents: 'all',
  coaches: 'coach',
  decisions: 'decisions',
  publications: 'fil',
};

export function isAdminFocSectionId(id: string): id is AdminFocSectionId {
  return isAdminNavSectionId(id);
}

export function resolveAdminFocNavigation(target: string): {
  section: AdminFocSectionId;
  hubTab?: string;
  screenTab?: string;
  focusId?: string;
} {
  return resolveAdminNav(target);
}

export function migrateAdminFocSectionId(id: string): AdminFocSectionId {
  return migrateAdminNavSectionId(id);
}

export const ADMIN_FOC_SIDEBAR_WIDTH = ADMIN_NAV_SIDEBAR_WIDTH;
export const ADMIN_FOC_SIDEBAR_COLLAPSED = ADMIN_NAV_SIDEBAR_COLLAPSED;
export const ADMIN_FOC_TOPBAR_HEIGHT = ADMIN_NAV_TOPBAR_HEIGHT;

export const DEFAULT_FOC_DASHBOARD_ORDER = DEFAULT_ADMIN_DASHBOARD_ORDER;
export type FocDashboardBlockId = AdminDashboardBlockId;

/** @deprecated — anciens ids feuille (compat prefs / tests) */
export type AdminFocLeafId = AdminFocSectionId | AdminFocLegacySectionId;
