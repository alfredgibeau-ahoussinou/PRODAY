import type { IconName } from '../components/ui/Icon';
import type { IntroSlideAction } from './discoverChapters';
import { WOMAN_SHOWCASE_IMAGES } from './womanShowcaseAssets';

export interface DiscoverIntroSlideWoman {
  id: string;
  kicker: string;
  title: string;
  body: string;
  image: number;
  icon: IconName;
  cta: string;
  action: IntroSlideAction;
}

export const DISCOVER_INTRO_SLIDES_WOMAN: DiscoverIntroSlideWoman[] = [
  {
    id: 'welcome',
    kicker: 'PRODAY WOMAN',
    title: 'Le foot\nau féminin.',
    body: 'Mercato F, matchs et profil joueuse — pensé pour les filles et les seniors F.',
    image: WOMAN_SHOWCASE_IMAGES.discoverHero,
    icon: 'heart',
    cta: 'Voir le live',
    action: 'live',
  },
  {
    id: 'modules',
    kicker: 'MERCATO F',
    title: 'Joueuses.\nClubs F.',
    body: 'Annonces et détections filtrées — visibilité sur le football féminin.',
    image: WOMAN_SHOWCASE_IMAGES.mercatoDetection,
    icon: 'search',
    cta: 'Les modules',
    action: 'modules',
  },
  {
    id: 'join',
    kicker: 'REJOINDRE',
    title: 'Ton compte\nWoman.',
    body: 'Inscription joueuse en quelques minutes — univers rose ProDay.',
    image: WOMAN_SHOWCASE_IMAGES.playerProfile,
    icon: 'person',
    cta: 'Commencer',
    action: 'signup',
  },
];

export const DISCOVER_UNIVERSE_CARDS_WOMAN = [
  {
    id: 'recrutement' as const,
    title: 'Mercato F',
    subtitle: 'Annonces féminines',
    image: WOMAN_SHOWCASE_IMAGES.mercatoDetection,
    icon: 'search' as IconName,
    accent: '#BE185D',
  },
  {
    id: 'matchs' as const,
    title: 'Matchs',
    subtitle: 'Amicaux & convocations F',
    image: WOMAN_SHOWCASE_IMAGES.friendlyMatch,
    icon: 'handshake' as IconName,
    accent: '#9D174D',
  },
  {
    id: 'arena' as const,
    title: 'Arena',
    subtitle: 'Tournois filles & F',
    image: WOMAN_SHOWCASE_IMAGES.arenaTournament,
    icon: 'trophy' as IconName,
    accent: '#831843',
  },
  {
    id: 'sponsors' as const,
    title: 'Partenaires',
    subtitle: 'Soutien au foot F',
    image: WOMAN_SHOWCASE_IMAGES.coachFounder,
    icon: 'star' as IconName,
    accent: '#DB2777',
  },
];
