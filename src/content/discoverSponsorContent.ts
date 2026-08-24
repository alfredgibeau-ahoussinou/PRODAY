import type { IconName } from '../components/ui/iconNames';
import { SHOWCASE_IMAGES } from './showcaseAssets';
import { PRODAY_POLE_ACCENTS } from '../theme/prodayBrand';

const SPONSOR = PRODAY_POLE_ACCENTS.sponsor;

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
