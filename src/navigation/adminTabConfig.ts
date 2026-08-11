/**
 * Console admin ProDay — 5 ateliers A→Z, entièrement en français.
 */

import type { IconName } from '../components/ui/iconNames';

export type AdminHqModeId =
  | 'pilotage'
  | 'decisions'
  | 'gestion'
  | 'abonnements'
  | 'systeme';

export type AdminGestionAtelier =
  | 'comptes'
  | 'clubs'
  | 'publications'
  | 'signalements'
  | 'evenements'
  | 'matchs'
  | 'recrutement'
  | 'candidatures'
  | 'paiements'
  | 'partenaires'
  | 'stages'
  | 'tournois'
  | 'annonces'
  | 'fil'
  | 'messages'
  | 'devis';

export type AdminHqRoute = {
  mode: AdminHqModeId;
  atelier?: AdminGestionAtelier;
  focusId?: string;
  focusQuery?: string;
};

export type AdminHqMode = {
  id: AdminHqModeId;
  label: string;
  short: string;
  icon: IconName;
  description: string;
};

export const ADMIN_HQ_MODES: AdminHqMode[] = [
  {
    id: 'pilotage',
    label: 'Pilotage',
    short: 'Pilotage',
    icon: 'home',
    description: 'État live et raccourcis d’action',
  },
  {
    id: 'decisions',
    label: 'Décisions',
    short: 'Décisions',
    icon: 'mail',
    description: 'File de décisions à trancher',
  },
  {
    id: 'gestion',
    label: 'Gestion',
    short: 'Gestion',
    icon: 'people',
    description: 'Modifier tout le contenu de l’app',
  },
  {
    id: 'abonnements',
    label: 'Abonnements',
    short: 'Offres',
    icon: 'star',
    description: 'Gratuit ↔ Payant, formules, transitions',
  },
  {
    id: 'systeme',
    label: 'Système',
    short: 'Système',
    icon: 'settings',
    description: 'Fonctionnalités, bêta, boutique, session',
  },
];

export const ADMIN_GESTION_ATELIERS: {
  id: AdminGestionAtelier;
  label: string;
  group: string;
}[] = [
  { id: 'comptes', label: 'Comptes', group: 'Personnes' },
  { id: 'clubs', label: 'Clubs & équipes', group: 'Personnes' },
  { id: 'publications', label: 'Publications', group: 'Contenu' },
  { id: 'signalements', label: 'Signalements', group: 'Contenu' },
  { id: 'fil', label: 'Fil plateforme', group: 'Contenu' },
  { id: 'annonces', label: 'Annonces club', group: 'Contenu' },
  { id: 'messages', label: 'Messages', group: 'Contenu' },
  { id: 'evenements', label: 'Événements', group: 'Terrain' },
  { id: 'matchs', label: 'Matchs amicaux', group: 'Terrain' },
  { id: 'tournois', label: 'Tournois', group: 'Terrain' },
  { id: 'stages', label: 'Stages', group: 'Terrain' },
  { id: 'recrutement', label: 'Recrutement', group: 'Marché' },
  { id: 'candidatures', label: 'Candidatures', group: 'Marché' },
  { id: 'paiements', label: 'Paiements club', group: 'Marché' },
  { id: 'partenaires', label: 'Offres partenaires', group: 'Marché' },
  { id: 'devis', label: 'Devis sponsors', group: 'Marché' },
];

/** @deprecated — anciens scopes annuaire */
export type AdminDirectoryScope =
  | 'users'
  | 'clubs'
  | 'reels'
  | 'reports'
  | 'events'
  | 'matches'
  | 'mercato'
  | 'applications'
  | 'payments'
  | 'sponsors'
  | 'stages'
  | 'tournaments'
  | 'announcements';

export const ADMIN_DIRECTORY_SCOPES: { id: AdminDirectoryScope; label: string }[] =
  ADMIN_GESTION_ATELIERS.filter((a) =>
    [
      'comptes',
      'clubs',
      'publications',
      'signalements',
      'evenements',
      'matchs',
      'recrutement',
      'candidatures',
      'paiements',
      'partenaires',
      'stages',
      'tournois',
      'annonces',
    ].includes(a.id),
  ).map((a) => ({
    id: atelierToLegacyScope(a.id)!,
    label: a.label,
  }));

function atelierToLegacyScope(id: AdminGestionAtelier): AdminDirectoryScope | null {
  const map: Partial<Record<AdminGestionAtelier, AdminDirectoryScope>> = {
    comptes: 'users',
    clubs: 'clubs',
    publications: 'reels',
    signalements: 'reports',
    evenements: 'events',
    matchs: 'matches',
    recrutement: 'mercato',
    candidatures: 'applications',
    paiements: 'payments',
    partenaires: 'sponsors',
    stages: 'stages',
    tournois: 'tournaments',
    annonces: 'announcements',
  };
  return map[id] ?? null;
}

export function legacyScopeToAtelier(scope: AdminDirectoryScope): AdminGestionAtelier {
  const map: Record<AdminDirectoryScope, AdminGestionAtelier> = {
    users: 'comptes',
    clubs: 'clubs',
    reels: 'publications',
    reports: 'signalements',
    events: 'evenements',
    matches: 'matchs',
    mercato: 'recrutement',
    applications: 'candidatures',
    payments: 'paiements',
    sponsors: 'partenaires',
    stages: 'stages',
    tournaments: 'tournois',
    announcements: 'annonces',
  };
  return map[scope];
}

export const ADMIN_WORK_KIND_LABELS: Record<string, string> = {
  verification: 'Vérification',
  reel: 'Publication',
  report: 'Signalement',
  payment: 'Paiement',
  application: 'Candidature',
  post: 'Annonce',
  quote: 'Devis',
};

export const ADMIN_PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critique',
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
};

export const ADMIN_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Refusé',
  paid: 'Payé',
  unpaid: 'Impayé',
  OPEN: 'Ouvert',
  CLOSED: 'Fermé',
  ACCEPTED: 'Accepté',
  REJECTED: 'Refusé',
  PENDING: 'En attente',
  INVITED: 'Invité',
  COUNTERED: 'Contre-proposition',
  DECLINED: 'Décliné',
  PLAYED: 'Joué',
  CANCELLED: 'Annulé',
  WAITLIST: 'Liste d’attente',
  VERIFY: 'À vérifier',
  verified: 'Vérifié',
  unverified: 'Non vérifié',
  free: 'Gratuit',
  pro: 'Payant',
  active: 'Actif',
  trialing: 'Essai',
  canceled: 'Résilié',
  past_due: 'Impayé',
};

export function adminStatusLabel(raw?: string | null): string {
  if (!raw) return '—';
  return ADMIN_STATUS_LABELS[raw] ?? ADMIN_STATUS_LABELS[raw.toLowerCase()] ?? raw;
}

export const ADMIN_SEARCH_KIND_LABELS: Record<string, string> = {
  user: 'Compte',
  club: 'Club',
  post: 'Annonce',
  event: 'Événement',
};

export const ADMIN_SUBSCRIPTION_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'free', label: 'Gratuit' },
  { id: 'pro', label: 'Payant' },
  { id: 'trialing', label: 'Essai' },
  { id: 'past_due', label: 'Impayé' },
  { id: 'expiring', label: 'Expire bientôt' },
] as const;

export type AdminSubscriptionFilter = (typeof ADMIN_SUBSCRIPTION_FILTERS)[number]['id'];

export const ADMIN_RAIL_WIDTH = 76;
export const ADMIN_INSPECTOR_WIDTH = 360;
export const ADMIN_WIDE_BREAKPOINT = 900;
export const ADMIN_ATELIER_WIDTH = 168;

export function adminHqRouteKey(route: AdminHqRoute): string {
  if (route.mode === 'gestion' && route.atelier) {
    return `gestion:${route.atelier}`;
  }
  return route.mode;
}

/** @deprecated */
export type AdminMainTabId =
  | 'pilotage'
  | 'inbox'
  | 'users'
  | 'clubs'
  | 'moderation'
  | 'plateforme'
  | 'analytics'
  | 'beta'
  | 'system';

/** @deprecated */
export type AdminContentSegment =
  | 'reels'
  | 'reports'
  | 'weekly'
  | 'events'
  | 'mercato'
  | 'matches'
  | 'applications'
  | 'payments'
  | 'sponsors'
  | 'feed'
  | 'stages'
  | 'tournaments'
  | 'messages';

/** @deprecated */
export function hqRouteFromLegacyTab(
  tab: AdminMainTabId,
  segment?: AdminContentSegment,
): AdminHqRoute {
  switch (tab) {
    case 'pilotage':
    case 'analytics':
      return { mode: 'pilotage' };
    case 'inbox':
      return { mode: 'decisions' };
    case 'users':
      return { mode: 'gestion', atelier: 'comptes' };
    case 'clubs':
      return { mode: 'gestion', atelier: 'clubs' };
    case 'moderation':
      return {
        mode: 'gestion',
        atelier: segment === 'reports' ? 'signalements' : 'publications',
      };
    case 'plateforme':
      if (segment === 'applications') return { mode: 'gestion', atelier: 'candidatures' };
      if (segment === 'payments') return { mode: 'gestion', atelier: 'paiements' };
      if (segment === 'sponsors') return { mode: 'gestion', atelier: 'devis' };
      if (segment === 'events') return { mode: 'gestion', atelier: 'evenements' };
      if (segment === 'matches') return { mode: 'gestion', atelier: 'matchs' };
      if (segment === 'mercato') return { mode: 'gestion', atelier: 'recrutement' };
      if (segment === 'stages') return { mode: 'gestion', atelier: 'stages' };
      if (segment === 'tournaments') return { mode: 'gestion', atelier: 'tournois' };
      if (segment === 'feed') return { mode: 'gestion', atelier: 'fil' };
      if (segment === 'messages') return { mode: 'gestion', atelier: 'messages' };
      return { mode: 'gestion', atelier: 'recrutement' };
    case 'beta':
    case 'system':
      return { mode: 'systeme' };
    default:
      return { mode: 'pilotage' };
  }
}

export const ADMIN_NAV_INSET = 24;
export const ADMIN_TAB_BAR_INSET = ADMIN_NAV_INSET;
export const ADMIN_SIDEBAR_WIDTH = ADMIN_RAIL_WIDTH;
