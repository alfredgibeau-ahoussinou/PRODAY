import type { IconName } from '../components/ui/Icon';
import type { IntroSlideAction } from './discoverChapters';
import { SHOWCASE_IMAGES } from './showcaseAssets';

export interface DiscoverIntroSlideSponsor {
  id: string;
  kicker: string;
  title: string;
  body: string;
  image: number;
  icon: IconName;
  cta: string;
  action: IntroSlideAction;
}

export const DISCOVER_INTRO_SLIDES_SPONSOR: DiscoverIntroSlideSponsor[] = [
  {
    id: 'welcome',
    kicker: 'PRO DAY SPONSOR',
    title: 'Votre marque\nsur le terrain.',
    body: 'Campagnes géo, ROI mesurable et vitrine auprès des clubs. L’espace dédié aux marques partenaires.',
    image: SHOWCASE_IMAGES.expSponsors,
    icon: 'star-four-points',
    cta: 'Découvrir',
    action: 'live',
  },
  {
    id: 'modules',
    kicker: 'VOS PILIERS',
    title: 'Visibilité &\nfinancement.',
    body: 'Offres actives, prospects clubs, messages et formules. Pilotez votre présence sponsor en un endroit.',
    image: SHOWCASE_IMAGES.expSponsors,
    icon: 'briefcase',
    cta: 'Voir les piliers',
    action: 'modules',
  },
  {
    id: 'join',
    kicker: 'REJOINDRE',
    title: 'Créer mon\nespace marque.',
    body: 'Inscription marque / sponsor. Validation ProDay puis accès à votre console or.',
    image: SHOWCASE_IMAGES.expSponsors,
    icon: 'business',
    cta: 'Créer mon compte Sponsor',
    action: 'signup',
  },
];

export const DISCOVER_UNIVERSE_CARDS_SPONSOR = [
  {
    id: 'sponsors' as const,
    title: 'Campagnes',
    subtitle: 'Offres & visibilité',
    image: SHOWCASE_IMAGES.expSponsors,
    icon: 'briefcase' as IconName,
    accent: '#D4AF37',
  },
  {
    id: 'gestion' as const,
    title: 'Réseau clubs',
    subtitle: 'Prospects & messages',
    image: SHOWCASE_IMAGES.expSponsors,
    icon: 'people' as IconName,
    accent: '#B8941F',
  },
  {
    id: 'recrutement' as const,
    title: 'ROI',
    subtitle: 'Impressions & leads',
    image: SHOWCASE_IMAGES.expSponsors,
    icon: 'star-four-points' as IconName,
    accent: '#F5D76E',
  },
];
