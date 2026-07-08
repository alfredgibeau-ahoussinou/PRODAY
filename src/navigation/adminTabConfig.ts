import type { IconName } from '../components/ui/Icon';

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

export type AdminNavSectionId =
  | 'overview'
  | 'community'
  | 'moderation'
  | 'platform'
  | 'insights'
  | 'beta'
  | 'system';

export type AdminRoute = {
  tab: AdminMainTabId;
  segment?: AdminContentSegment;
};

export type AdminNavItem = {
  id: string;
  tab: AdminMainTabId;
  segment?: AdminContentSegment;
  label: string;
  description: string;
  icon: IconName;
  section: AdminNavSectionId;
  badgeKey?: 'inbox' | 'verifications' | 'moderation' | 'reels' | 'reports';
};

export const ADMIN_NAV_SECTIONS: { id: AdminNavSectionId; label: string }[] = [
  { id: 'overview', label: 'Vue d’ensemble' },
  { id: 'community', label: 'Communauté' },
  { id: 'moderation', label: 'Modération' },
  { id: 'platform', label: 'Contenu plateforme' },
  { id: 'insights', label: 'Insights' },
  { id: 'beta', label: 'Programme bêta' },
  { id: 'system', label: 'Système' },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: 'pilotage',
    tab: 'pilotage',
    label: 'Accueil',
    description: 'Vue opérationnelle temps réel',
    icon: 'home',
    section: 'overview',
  },
  {
    id: 'inbox',
    tab: 'inbox',
    label: 'À traiter',
    description: 'File d’actions priorisée',
    icon: 'mail',
    section: 'overview',
    badgeKey: 'inbox',
  },
  {
    id: 'users',
    tab: 'users',
    label: 'Utilisateurs',
    description: 'Comptes, rôles et vérifications',
    icon: 'people',
    section: 'community',
    badgeKey: 'verifications',
  },
  {
    id: 'clubs',
    tab: 'clubs',
    label: 'Clubs',
    description: 'Structures et annonces',
    icon: 'business',
    section: 'community',
  },
  {
    id: 'reels',
    tab: 'moderation',
    segment: 'reels',
    label: 'Reels',
    description: 'Publications communauté',
    icon: 'time',
    section: 'moderation',
    badgeKey: 'reels',
  },
  {
    id: 'reports',
    tab: 'moderation',
    segment: 'reports',
    label: 'Signalements',
    description: 'Reels signalés',
    icon: 'warning',
    section: 'moderation',
    badgeKey: 'reports',
  },
  {
    id: 'weekly',
    tab: 'moderation',
    segment: 'weekly',
    label: 'Question du fil',
    description: 'Question hebdo joueurs',
    icon: 'chat',
    section: 'moderation',
  },
  {
    id: 'messages',
    tab: 'moderation',
    segment: 'messages',
    label: 'Messages',
    description: 'Conversations et modération',
    icon: 'mail',
    section: 'moderation',
  },
  {
    id: 'events',
    tab: 'plateforme',
    segment: 'events',
    label: 'Événements',
    description: 'Convocations et détections',
    icon: 'calendar',
    section: 'platform',
  },
  {
    id: 'mercato',
    tab: 'plateforme',
    segment: 'mercato',
    label: 'Mercato',
    description: 'Annonces de recrutement',
    icon: 'briefcase',
    section: 'platform',
  },
  {
    id: 'matches',
    tab: 'plateforme',
    segment: 'matches',
    label: 'Matchs amicaux',
    description: 'Propositions inter-clubs',
    icon: 'handshake',
    section: 'platform',
  },
  {
    id: 'applications',
    tab: 'plateforme',
    segment: 'applications',
    label: 'Candidatures',
    description: 'Postulations Mercato',
    icon: 'document',
    section: 'platform',
  },
  {
    id: 'payments',
    tab: 'plateforme',
    segment: 'payments',
    label: 'Paiements',
    description: 'Cotisations clubs',
    icon: 'bag',
    section: 'platform',
  },
  {
    id: 'sponsors',
    tab: 'plateforme',
    segment: 'sponsors',
    label: 'Sponsors',
    description: 'Offres et financement',
    icon: 'star',
    section: 'platform',
  },
  {
    id: 'feed',
    tab: 'plateforme',
    segment: 'feed',
    label: 'Annonces',
    description: 'Fil actualités plateforme',
    icon: 'notifications',
    section: 'platform',
  },
  {
    id: 'stages',
    tab: 'plateforme',
    segment: 'stages',
    label: 'Stages',
    description: 'Offres et candidatures',
    icon: 'calendar',
    section: 'platform',
  },
  {
    id: 'tournaments',
    tab: 'plateforme',
    segment: 'tournaments',
    label: 'Tournois',
    description: 'Compétitions organisées',
    icon: 'star-four-points',
    section: 'platform',
  },
  {
    id: 'analytics',
    tab: 'analytics',
    label: 'Analytics',
    description: 'Tendances et snapshots',
    icon: 'star-four-points',
    section: 'insights',
  },
  {
    id: 'beta',
    tab: 'beta',
    label: 'Programme bêta',
    description: 'Waitlist · accès testeurs · emails',
    icon: 'shield',
    section: 'beta',
  },
  {
    id: 'system',
    tab: 'system',
    label: 'Configuration',
    description: 'Ops, audit et session',
    icon: 'settings',
    section: 'system',
  },
];

const PAGE_META: Record<
  AdminMainTabId,
  { title: string; subtitle: string }
> = {
  pilotage: {
    title: 'Accueil',
    subtitle: 'Pilotage · 6 pôles · proday75.fr',
  },
  inbox: {
    title: 'À traiter',
    subtitle: 'Actions priorisées · vérif., modération, paiements',
  },
  users: {
    title: 'Utilisateurs',
    subtitle: 'Comptes, rôles, vérifications profil',
  },
  clubs: {
    title: 'Clubs',
    subtitle: 'Structures · annonces club',
  },
  moderation: {
    title: 'Modération',
    subtitle: 'Reels · signalements · fil · messages',
  },
  plateforme: {
    title: 'Contenu plateforme',
    subtitle: 'Événements · Mercato · paiements · sponsors',
  },
  analytics: {
    title: 'Analytics',
    subtitle: 'Tendances · snapshots · répartition',
  },
  beta: {
    title: 'Programme bêta',
    subtitle: 'Waitlist · validation · accès testeurs',
  },
  system: {
    title: 'Configuration',
    subtitle: 'Ops · proday75.fr · audit · session',
  },
};

const SEGMENT_META: Partial<Record<AdminContentSegment, { title: string; subtitle: string }>> = {
  reels: { title: 'Reels', subtitle: 'Modération des publications communauté' },
  reports: { title: 'Signalements', subtitle: 'Reels signalés par les utilisateurs' },
  weekly: { title: 'Question du fil', subtitle: 'Question hebdomadaire joueurs' },
  messages: { title: 'Messages', subtitle: 'Modération des conversations' },
  events: { title: 'Événements', subtitle: 'Convocations et détections saison' },
  mercato: { title: 'Mercato', subtitle: 'Annonces de recrutement' },
  matches: { title: 'Matchs amicaux', subtitle: 'Propositions inter-clubs' },
  applications: { title: 'Candidatures', subtitle: 'Postulations Mercato' },
  payments: { title: 'Paiements', subtitle: 'Cotisations et frais d’équipe' },
  sponsors: { title: 'Sponsors', subtitle: 'Offres partenaires et financement' },
  feed: { title: 'Annonces plateforme', subtitle: 'Fil actualités officiel ProDay' },
  stages: { title: 'Stages', subtitle: 'Offres et candidatures pôle formation' },
  tournaments: { title: 'Tournois', subtitle: 'Compétitions et inscriptions clubs' },
};

export function resolveAdminPageMeta(
  tab: AdminMainTabId,
  segment?: AdminContentSegment,
): { title: string; subtitle: string } {
  if (segment && SEGMENT_META[segment]) return SEGMENT_META[segment]!;
  return PAGE_META[tab];
}

export function adminRouteKey(route: AdminRoute): string {
  return route.segment ? `${route.tab}:${route.segment}` : route.tab;
}

export function isAdminRouteActive(
  route: AdminRoute,
  tab: AdminMainTabId,
  segment?: AdminContentSegment,
): boolean {
  if (route.tab !== tab) return false;
  if (route.segment) return route.segment === segment;
  return !segment;
}

/** Marge bas de page — menu latéral (pas de tab bar) */
export const ADMIN_NAV_INSET = 24;

/** @deprecated Utiliser ADMIN_NAV_INSET */
export const ADMIN_TAB_BAR_INSET = ADMIN_NAV_INSET;
