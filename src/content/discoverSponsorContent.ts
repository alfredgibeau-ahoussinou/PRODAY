import type { IconName } from '../components/ui/iconNames';
import { SHOWCASE_IMAGES } from './showcaseAssets';
import { PRODAY_POLE_ACCENTS } from '../theme/prodayBrand';

const SPONSOR = PRODAY_POLE_ACCENTS.sponsor;

/**
 * Lignes éditoriales guest Sponsor — foot × marque × ROI.
 * Affichées sans images sur DiscoverSponsorHome.
 */
export const SPONSOR_SPACE_LINES: ReadonlyArray<{
  id: string;
  title: string;
  subtitle: string;
  icon: IconName;
  accent: string;
}> = [
  {
    id: 'campaigns',
    title: 'Campagnes',
    subtitle: 'Visibilité locale auprès des clubs',
    icon: 'briefcase',
    accent: SPONSOR,
  },
  {
    id: 'network',
    title: 'Réseau',
    subtitle: 'Prospects et échanges terrain',
    icon: 'people',
    accent: SPONSOR,
  },
  {
    id: 'roi',
    title: 'ROI',
    subtitle: 'Impressions, clics, contacts',
    icon: 'star-four-points',
    accent: SPONSOR,
  },
];

/**
 * Cartes modules (compat homeExperience / getDiscoverUniverseCards).
 * Images conservées pour les parcours qui en ont encore besoin — pas sur la home guest.
 */
export const DISCOVER_UNIVERSE_CARDS_SPONSOR = [
  {
    id: 'sponsors' as const,
    title: 'Campagnes',
    subtitle: 'Offres & visibilité',
    image: SHOWCASE_IMAGES.expSponsors,
    icon: 'briefcase' as IconName,
    accent: SPONSOR,
  },
  {
    id: 'gestion' as const,
    title: 'Réseau clubs',
    subtitle: 'Prospects & messages',
    image: SHOWCASE_IMAGES.expSponsors,
    icon: 'people' as IconName,
    accent: SPONSOR,
  },
  {
    id: 'recrutement' as const,
    title: 'ROI',
    subtitle: 'Impressions & leads',
    image: SHOWCASE_IMAGES.expSponsors,
    icon: 'star-four-points' as IconName,
    accent: SPONSOR,
  },
];
