import type { IconName } from '../components/ui/iconNames';

export type SponsorMainTabId =
  | 'pilotage'
  | 'offres'
  | 'clubs'
  | 'reseau'
  | 'marque'
  | 'tarifs';

export type SponsorContentSegment = 'messages' | 'prospects' | 'contacts' | 'contract';

export type SponsorNavSectionId = 'pilotage' | 'commercial' | 'reseau' | 'marque';

export type SponsorRoute = {
  tab: SponsorMainTabId;
  segment?: SponsorContentSegment;
};

export type SponsorNavItem = {
  id: string;
  tab: SponsorMainTabId;
  segment?: SponsorContentSegment;
  label: string;
  description: string;
  icon: IconName;
  section: SponsorNavSectionId;
  badgeKey?: 'messages' | 'prospects' | 'offers';
};

export const SPONSOR_NAV_SECTIONS: { id: SponsorNavSectionId; label: string }[] = [
  { id: 'pilotage', label: 'Pilotage' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'reseau', label: 'Réseau' },
  { id: 'marque', label: 'Marque' },
];

export const SPONSOR_NAV_ITEMS: SponsorNavItem[] = [
  {
    id: 'pilotage',
    tab: 'pilotage',
    label: 'Accueil',
    description: 'Vue d’ensemble · KPIs et activité',
    icon: 'home',
    section: 'pilotage',
  },
  {
    id: 'offres',
    tab: 'offres',
    label: 'Mes offres',
    description: 'Campagnes et visibilité marque',
    icon: 'briefcase',
    section: 'commercial',
    badgeKey: 'offers',
  },
  {
    id: 'clubs',
    tab: 'clubs',
    label: 'Financement clubs',
    description: 'Objectifs et contributions',
    icon: 'handshake',
    section: 'commercial',
  },
  {
    id: 'tarifs',
    tab: 'tarifs',
    label: 'Formules & tarifs',
    description: 'Abonnement et packs sponsors',
    icon: 'star',
    section: 'commercial',
  },
  {
    id: 'messages',
    tab: 'reseau',
    segment: 'messages',
    label: 'Messages',
    description: 'Conversations avec les clubs',
    icon: 'chat',
    section: 'reseau',
    badgeKey: 'messages',
  },
  {
    id: 'prospects',
    tab: 'reseau',
    segment: 'prospects',
    label: 'Prospects',
    description: 'Clubs à contacter',
    icon: 'people',
    section: 'reseau',
    badgeKey: 'prospects',
  },
  {
    id: 'contacts',
    tab: 'reseau',
    segment: 'contacts',
    label: 'Contacts',
    description: 'Clubs partenaires · activation terrain',
    icon: 'handshake',
    section: 'reseau',
  },
  {
    id: 'marque',
    tab: 'marque',
    label: 'Marque & compte',
    description: 'Identité, abonnement, légal',
    icon: 'business',
    section: 'marque',
  },
  {
    id: 'contract',
    tab: 'marque',
    segment: 'contract',
    label: 'Contrat',
    description: 'Formule et conditions commerciales',
    icon: 'document',
    section: 'marque',
  },
];

const PAGE_META: Record<SponsorMainTabId, { title: string; subtitle: string }> = {
  pilotage: {
    title: 'Accueil',
    subtitle: 'Pilotage sponsor · indicateurs clés',
  },
  offres: {
    title: 'Mes offres',
    subtitle: 'Campagnes actives et brouillons',
  },
  clubs: {
    title: 'Financement clubs',
    subtitle: 'Objectifs de collecte et contributions',
  },
  reseau: {
    title: 'Réseau',
    subtitle: 'Messages et prospects clubs',
  },
  marque: {
    title: 'Marque & compte',
    subtitle: 'Identité, abonnement et paramètres',
  },
  tarifs: {
    title: 'Formules & tarifs',
    subtitle: 'Packs sponsors ProDay',
  },
};

const SEGMENT_META: Partial<Record<SponsorContentSegment, { title: string; subtitle: string }>> = {
  messages: { title: 'Messages', subtitle: 'Conversations avec les clubs' },
  prospects: { title: 'Prospects', subtitle: 'Clubs recommandés à contacter' },
  contacts: { title: 'Contacts', subtitle: 'Clubs partenaires · activation terrain' },
  contract: { title: 'Contrat', subtitle: 'Formule et conditions commerciales' },
};

export function resolveSponsorPageMeta(
  tab: SponsorMainTabId,
  segment?: SponsorContentSegment,
): { title: string; subtitle: string } {
  if (segment && SEGMENT_META[segment]) return SEGMENT_META[segment]!;
  return PAGE_META[tab];
}

export function sponsorRouteKey(route: SponsorRoute): string {
  return route.segment ? `${route.tab}:${route.segment}` : route.tab;
}

export function isSponsorRouteActive(
  route: SponsorRoute,
  tab: SponsorMainTabId,
  segment?: SponsorContentSegment,
): boolean {
  if (route.tab !== tab) return false;
  if (route.segment) return route.segment === segment;
  return !segment;
}

/** Marge bas de page — menu latéral (pas de tab bar joueur). */
export const SPONSOR_NAV_INSET = 24;
