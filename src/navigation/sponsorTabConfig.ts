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
    description: 'KPIs et priorité du jour',
    icon: 'home',
    section: 'pilotage',
  },
  {
    id: 'offres',
    tab: 'offres',
    label: 'Mes offres',
    description: 'Campagnes marque',
    icon: 'briefcase',
    section: 'commercial',
    badgeKey: 'offers',
  },
  {
    id: 'clubs',
    tab: 'clubs',
    label: 'Financement clubs',
    description: 'Objectifs terrain',
    icon: 'handshake',
    section: 'commercial',
  },
  {
    id: 'tarifs',
    tab: 'tarifs',
    label: 'Formules',
    description: 'Packs sponsors',
    icon: 'star',
    section: 'commercial',
  },
  {
    id: 'messages',
    tab: 'reseau',
    segment: 'messages',
    label: 'Messages',
    description: 'Clubs en conversation',
    icon: 'chat',
    section: 'reseau',
    badgeKey: 'messages',
  },
  {
    id: 'prospects',
    tab: 'reseau',
    segment: 'prospects',
    label: 'Prospects',
    description: 'Clubs à activer',
    icon: 'people',
    section: 'reseau',
    badgeKey: 'prospects',
  },
  {
    id: 'contacts',
    tab: 'reseau',
    segment: 'contacts',
    label: 'Contacts',
    description: 'Partenaires actifs',
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
    subtitle: 'Priorité et indicateurs',
  },
  offres: {
    title: 'Mes offres',
    subtitle: 'Campagnes marque',
  },
  clubs: {
    title: 'Financement',
    subtitle: 'Objectifs clubs',
  },
  reseau: {
    title: 'Réseau',
    subtitle: 'Messages et prospects',
  },
  marque: {
    title: 'Marque',
    subtitle: 'Compte et identité',
  },
  tarifs: {
    title: 'Formules',
    subtitle: 'Packs sponsors',
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
