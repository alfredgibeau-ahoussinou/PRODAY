/**
 * Navigation Football Operations Center — Admin ProDay.
 * Menu simplifié (7 sections). Sous-vues regroupées via onglets in-page.
 */

import type { IconName } from '../components/ui/iconNames';

export type AdminFocSectionId =
  | 'dashboard'
  | 'personnes'
  | 'clubs'
  | 'competition'
  | 'operations'
  | 'finances'
  | 'plateforme';

/** Anciens ids sidebar (migration prefs / liens dashboard). */
export type AdminFocLegacySectionId =
  | 'adherents'
  | 'matchs'
  | 'competitions'
  | 'recrutement'
  | 'performance'
  | 'communication'
  | 'video'
  | 'parametres';

export type AdminFocNavItem = {
  id: AdminFocSectionId;
  label: string;
  short: string;
  icon: IconName;
};

export const ADMIN_FOC_NAV: AdminFocNavItem[] = [
  { id: 'dashboard', label: 'Accueil', short: 'Accueil', icon: 'home' },
  { id: 'personnes', label: 'Personnes', short: 'Pers.', icon: 'people' },
  { id: 'clubs', label: 'Clubs & équipes', short: 'Clubs', icon: 'business' },
  { id: 'competition', label: 'Compétition', short: 'Compét.', icon: 'football' },
  { id: 'operations', label: 'Opérations', short: 'Ops', icon: 'chat' },
  { id: 'finances', label: 'Finances', short: 'Finance', icon: 'bag' },
  { id: 'plateforme', label: 'Plateforme', short: 'Platf.', icon: 'settings' },
];

/** Onglets de premier niveau par section sidebar. */
export const ADMIN_FOC_TABS: Record<
  AdminFocSectionId,
  { id: string; label: string }[]
> = {
  dashboard: [{ id: 'overview', label: 'Vue d’ensemble' }],
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
  competition: [
    { id: 'matchs', label: 'Matchs' },
    { id: 'competitions', label: 'Compétitions' },
  ],
  operations: [
    { id: 'recrutement', label: 'Recrutement' },
    { id: 'communication', label: 'Communication' },
    { id: 'video', label: 'Vidéo' },
  ],
  finances: [
    { id: 'abonnements', label: 'Abonnements' },
    { id: 'paiements', label: 'Paiements club' },
    { id: 'sponsors', label: 'Sponsors' },
    { id: 'boutique', label: 'Boutique' },
  ],
  plateforme: [
    { id: 'performance', label: 'Performance' },
    { id: 'parametres', label: 'Paramètres' },
  ],
};

/** Onglets internes des écrans FOC (sous un hub ou section feuille). */
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
  parametres: [
    { id: 'personnaliser', label: 'Personnaliser' },
    { id: 'systeme', label: 'Système' },
    { id: 'audit', label: 'Audit' },
    { id: 'beta', label: 'Bêta' },
  ],
} as const;

export const ADMIN_FOC_LEGACY_SECTION_MAP: Record<
  AdminFocLegacySectionId,
  AdminFocSectionId
> = {
  adherents: 'personnes',
  matchs: 'competition',
  competitions: 'competition',
  recrutement: 'operations',
  communication: 'operations',
  video: 'operations',
  performance: 'plateforme',
  parametres: 'plateforme',
};

/** Onglet hub par défaut quand on navigue via un ancien id feuille. */
export const ADMIN_FOC_LEGACY_HUB_TAB: Partial<
  Record<AdminFocLegacySectionId, string>
> = {
  matchs: 'matchs',
  competitions: 'competitions',
  recrutement: 'recrutement',
  communication: 'communication',
  video: 'video',
  performance: 'performance',
  parametres: 'parametres',
};

/** Cibles legacy avec onglet in-page (Personnes, Communication, Finances…). */
export type AdminFocDeepLinkId =
  | AdminFocLegacySectionId
  | 'coaches'
  | 'publications'
  | 'decisions';

/** Onglet in-page quand on navigue via une cible legacy profonde. */
export const ADMIN_FOC_LEGACY_SCREEN_TAB: Partial<Record<AdminFocDeepLinkId, string>> = {
  adherents: 'all',
  coaches: 'coach',
  decisions: 'decisions',
  publications: 'decisions',
};

const SECTION_IDS = new Set<string>(ADMIN_FOC_NAV.map((n) => n.id));

export function isAdminFocSectionId(id: string): id is AdminFocSectionId {
  return SECTION_IDS.has(id);
}

export function resolveAdminFocNavigation(target: string): {
  section: AdminFocSectionId;
  hubTab?: string;
  screenTab?: string;
} {
  if (isAdminFocSectionId(target)) {
    return { section: target };
  }

  if (target === 'coaches') {
    return { section: 'personnes', screenTab: 'coach' };
  }
  if (target === 'publications') {
    return {
      section: 'operations',
      hubTab: 'communication',
      screenTab: 'decisions',
    };
  }
  if (target === 'decisions') {
    return { section: 'personnes', screenTab: 'decisions' };
  }

  const legacy = target as AdminFocLegacySectionId;
  const section = ADMIN_FOC_LEGACY_SECTION_MAP[legacy];
  if (section) {
    const screenTab = ADMIN_FOC_LEGACY_SCREEN_TAB[legacy as AdminFocDeepLinkId];
    return {
      section,
      hubTab: ADMIN_FOC_LEGACY_HUB_TAB[legacy],
      screenTab,
    };
  }
  return { section: 'dashboard' };
}

export function migrateAdminFocSectionId(id: string): AdminFocSectionId {
  return resolveAdminFocNavigation(id).section;
}

export const ADMIN_FOC_SIDEBAR_WIDTH = 248;
export const ADMIN_FOC_SIDEBAR_COLLAPSED = 72;
export const ADMIN_FOC_TOPBAR_HEIGHT = 56;

export const DEFAULT_FOC_DASHBOARD_ORDER = [
  'kpis',
  'activity',
  'matchs',
  'decisions',
  'recrutement',
] as const;

export type FocDashboardBlockId = (typeof DEFAULT_FOC_DASHBOARD_ORDER)[number];

/** @deprecated — anciens ids feuille (compat prefs / tests) */
export type AdminFocLeafId = AdminFocSectionId | AdminFocLegacySectionId;
