/**
 * Registre de navigation — Centre de contrôle Admin ProDay.
 * Une entrée de menu = une section fonctionnelle (Firestore / services branchés).
 */

import type { IconName } from '../components/ui/iconNames';

/** Identifiants menu sidebar (Principal + Administration). */
export type AdminSectionId =
  | 'accueil'
  | 'utilisateurs'
  | 'clubs'
  | 'coachs'
  | 'joueurs'
  | 'parents'
  | 'equipes'
  | 'matchs_events'
  | 'recrutement'
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
  | 'config_plateforme';

export type AdminNavGroupId = 'principal' | 'administration';

/** Écrans montés dans le shell (réutilise les écrans FOC existants). */
export type AdminScreenKey =
  | 'dashboard'
  | 'adherents'
  | 'clubs'
  | 'matchs_events'
  | 'recrutement'
  | 'performance'
  | 'communication'
  | 'finances'
  | 'video'
  | 'parametres';

export type AdminNavItem = {
  id: AdminSectionId;
  label: string;
  short: string;
  icon: IconName;
  group: AdminNavGroupId;
  /** Route vers l'écran + onglet interne éventuel. */
  route: {
    screen: AdminScreenKey;
    tab?: string;
  };
};

export const ADMIN_NAV_GROUPS: { id: AdminNavGroupId; label: string }[] = [
  { id: 'principal', label: 'Principal' },
  { id: 'administration', label: 'Administration' },
];

/** Menu complet — uniquement sections branchées sur des écrans/services réels. */
export const ADMIN_NAV: AdminNavItem[] = [
  {
    id: 'accueil',
    label: 'Accueil',
    short: 'Accueil',
    icon: 'home',
    group: 'principal',
    route: { screen: 'dashboard' },
  },
  {
    id: 'utilisateurs',
    label: 'Utilisateurs',
    short: 'Users',
    icon: 'people',
    group: 'principal',
    route: { screen: 'adherents', tab: 'all' },
  },
  {
    id: 'clubs',
    label: 'Clubs',
    short: 'Clubs',
    icon: 'business',
    group: 'principal',
    route: { screen: 'clubs', tab: 'clubs' },
  },
  {
    id: 'coachs',
    label: 'Coachs',
    short: 'Coachs',
    icon: 'person',
    group: 'principal',
    route: { screen: 'adherents', tab: 'coach' },
  },
  {
    id: 'joueurs',
    label: 'Joueurs',
    short: 'Joueurs',
    icon: 'football',
    group: 'principal',
    route: { screen: 'adherents', tab: 'player' },
  },
  {
    id: 'parents',
    label: 'Parents',
    short: 'Parents',
    icon: 'people',
    group: 'principal',
    route: { screen: 'adherents', tab: 'parent' },
  },
  {
    id: 'equipes',
    label: 'Équipes',
    short: 'Équipes',
    icon: 'people',
    group: 'principal',
    route: { screen: 'clubs', tab: 'teams' },
  },
  {
    id: 'matchs_events',
    label: 'Matchs & Événements',
    short: 'Matchs',
    icon: 'calendar',
    group: 'principal',
    route: { screen: 'matchs_events', tab: 'matchs' },
  },
  {
    id: 'recrutement',
    label: 'Recrutement',
    short: 'Recrut.',
    icon: 'handshake',
    group: 'principal',
    route: { screen: 'recrutement', tab: 'bassin' },
  },
  {
    id: 'video',
    label: 'Vidéo',
    short: 'Vidéo',
    icon: 'videocam',
    group: 'principal',
    route: { screen: 'video', tab: 'cameras' },
  },
  {
    id: 'abonnements',
    label: 'Abonnements & Paiements',
    short: 'Abos',
    icon: 'star',
    group: 'principal',
    route: { screen: 'finances', tab: 'abonnements' },
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    short: 'Shop',
    icon: 'bag',
    group: 'principal',
    route: { screen: 'finances', tab: 'boutique' },
  },
  {
    id: 'sponsors',
    label: 'Sponsors',
    short: 'Sponsors',
    icon: 'star-four-points',
    group: 'principal',
    route: { screen: 'finances', tab: 'sponsors' },
  },
  {
    id: 'contenus',
    label: 'Contenus',
    short: 'Contenus',
    icon: 'document',
    group: 'principal',
    route: { screen: 'communication', tab: 'fil' },
  },
  {
    id: 'messagerie',
    label: 'Messagerie',
    short: 'Messages',
    icon: 'chat',
    group: 'principal',
    route: { screen: 'communication', tab: 'messages' },
  },
  {
    id: 'signalements',
    label: 'Signalements',
    short: 'Signaux',
    icon: 'alert-circle',
    group: 'principal',
    route: { screen: 'communication', tab: 'decisions' },
  },
  {
    id: 'statistiques',
    label: 'Statistiques',
    short: 'Stats',
    icon: 'star-four-points',
    group: 'principal',
    route: { screen: 'performance', tab: 'stats' },
  },
  {
    id: 'parametres',
    label: 'Paramètres',
    short: 'Réglages',
    icon: 'settings',
    group: 'principal',
    route: { screen: 'parametres', tab: 'personnaliser' },
  },
  {
    id: 'audit',
    label: 'Journal d’activité',
    short: 'Journal',
    icon: 'document',
    group: 'administration',
    route: { screen: 'parametres', tab: 'audit' },
  },
  {
    id: 'securite',
    label: 'Sécurité',
    short: 'Sécu',
    icon: 'shield',
    group: 'administration',
    route: { screen: 'parametres', tab: 'systeme' },
  },
  {
    id: 'config_plateforme',
    label: 'Configuration plateforme',
    short: 'Config',
    icon: 'settings',
    group: 'administration',
    route: { screen: 'parametres', tab: 'systeme' },
  },
];

export const ADMIN_SIDEBAR_WIDTH = 260;
export const ADMIN_SIDEBAR_COLLAPSED = 72;
export const ADMIN_TOPBAR_HEIGHT = 56;
export const ADMIN_DESKTOP_BREAKPOINT = 768;
export const ADMIN_WIDE_BREAKPOINT = 900;
export const ADMIN_INSPECTOR_WIDTH = 360;
export const ADMIN_NAV_INSET = 24;

export const DEFAULT_ADMIN_DASHBOARD_ORDER = [
  'work_today',
  'users',
  'clubs',
  'activity',
  'business',
] as const;

export type AdminDashboardBlockId = (typeof DEFAULT_ADMIN_DASHBOARD_ORDER)[number];

/** Sous-onglets par écran (affichés dans la page). */
export const ADMIN_SCREEN_TABS: Record<
  Exclude<AdminScreenKey, 'dashboard' | 'matchs_events'>,
  { id: string; label: string }[]
> = {
  adherents: [
    { id: 'all', label: 'Tous' },
    { id: 'player', label: 'Joueurs' },
    { id: 'youth', label: 'Monde -13' },
    { id: 'teen', label: '13–17' },
    { id: 'adult', label: '18+' },
    { id: 'parent', label: 'Parents' },
    { id: 'coach', label: 'Coachs' },
    { id: 'club', label: 'Dirigeants' },
    { id: 'decisions', label: 'À valider' },
  ],
  clubs: [
    { id: 'clubs', label: 'Clubs' },
    { id: 'teams', label: 'Équipes' },
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
  finances: [
    { id: 'abonnements', label: 'Abonnements' },
    { id: 'paiements', label: 'Paiements club' },
    { id: 'sponsors', label: 'Sponsors' },
    { id: 'boutique', label: 'Boutique' },
  ],
  video: [
    { id: 'cameras', label: 'Caméras' },
    { id: 'videos', label: 'Vidéos' },
  ],
  parametres: [
    { id: 'personnaliser', label: 'Personnaliser' },
    { id: 'systeme', label: 'Système' },
    { id: 'audit', label: 'Audit' },
    { id: 'beta', label: 'Bêta' },
  ],
};

export const ADMIN_MATCHS_EVENTS_TABS = [
  { id: 'matchs', label: 'Matchs' },
  { id: 'competitions', label: 'Compétitions' },
] as const;

export const ADMIN_COMPETITIONS_TABS = [
  { id: 'events', label: 'Événements' },
  { id: 'tournaments', label: 'Tournois' },
] as const;

export const ADMIN_MATCHS_TABS = [
  { id: 'all', label: 'Calendrier' },
  { id: 'upcoming', label: 'À venir' },
  { id: 'done', label: 'Résultats' },
  { id: 'invites', label: 'Invitations' },
] as const;

export const ADMIN_WORK_KIND_LABELS: Record<string, string> = {
  verification: 'Vérification',
  reel: 'Publication',
  report: 'Signalement',
  payment: 'Paiement',
  application: 'Candidature',
  post: 'Annonce',
  quote: 'Devis',
  subscription_request: 'Abonnement',
  membership: 'Adhésion',
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

/** Mappe un item de file de travail / recherche vers une section menu. */
export function adminSectionForWorkKind(
  kind: string,
): AdminSectionId {
  switch (kind) {
    case 'verification':
    case 'membership':
      return 'utilisateurs';
    case 'reel':
      return 'contenus';
    case 'report':
      return 'signalements';
    case 'payment':
    case 'subscription_request':
      return 'abonnements';
    case 'application':
      return 'recrutement';
    case 'quote':
      return 'sponsors';
    default:
      return 'signalements';
  }
}

export function adminSectionForSearchKind(
  kind: 'user' | 'club' | 'post' | 'event',
): AdminSectionId {
  switch (kind) {
    case 'user':
      return 'utilisateurs';
    case 'club':
      return 'clubs';
    case 'post':
      return 'recrutement';
    case 'event':
      return 'matchs_events';
    default:
      return 'accueil';
  }
}

export function getAdminNavItem(section: AdminSectionId): AdminNavItem | undefined {
  return ADMIN_NAV.find((n) => n.id === section);
}

export function sectionTitle(section: AdminSectionId): string {
  return getAdminNavItem(section)?.label ?? 'Centre de contrôle';
}

export function navItemsByGroup(group: AdminNavGroupId): AdminNavItem[] {
  return ADMIN_NAV.filter((n) => n.group === group);
}

/** @deprecated — compat tests / prefs legacy FOC ids */
export type AdminFocSectionId = AdminScreenKey;
export const ADMIN_FOC_NAV = ADMIN_NAV.filter((n) =>
  [
    'accueil',
    'utilisateurs',
    'clubs',
    'matchs_events',
    'recrutement',
    'statistiques',
    'contenus',
    'abonnements',
    'video',
    'parametres',
  ].includes(n.id),
).map((n) => ({
  id: n.route.screen as AdminFocSectionId,
  label: n.label,
  short: n.short,
  icon: n.icon,
}));

export const ADMIN_FOC_TABS = {
  ...ADMIN_SCREEN_TABS,
  dashboard: [{ id: 'overview', label: 'Vue d’ensemble' }],
  matchs: [...ADMIN_MATCHS_TABS],
  competitions: [...ADMIN_COMPETITIONS_TABS],
};
export const ADMIN_FOC_SIDEBAR_WIDTH = ADMIN_SIDEBAR_WIDTH;
export const ADMIN_FOC_SIDEBAR_COLLAPSED = ADMIN_SIDEBAR_COLLAPSED;
export const ADMIN_FOC_TOPBAR_HEIGHT = ADMIN_TOPBAR_HEIGHT;
export const DEFAULT_FOC_DASHBOARD_ORDER = DEFAULT_ADMIN_DASHBOARD_ORDER;
export type FocDashboardBlockId = AdminDashboardBlockId;
export type AdminFocLeafId = AdminFocSectionId;
