import type { IconName } from '../components/ui/Icon';
import type { IntroSlideAction } from './discoverChapters';
import { SHOWCASE_IMAGES } from './showcaseAssets';

export const AMATEUR_ORANGE = {
  primary: '#EA580C',
  dark: '#9A3412',
  mid: '#C2410C',
  light: '#F97316',
} as const;

export interface DiscoverIntroSlideAmateur {
  id: string;
  kicker: string;
  title: string;
  body: string;
  image: number;
  icon: IconName;
  cta: string;
  action: IntroSlideAction;
}

export const DISCOVER_INTRO_SLIDES_AMATEUR: DiscoverIntroSlideAmateur[] = [
  {
    id: 'welcome',
    kicker: 'PRO DAY AMATEUR',
    title: 'Le foot amateur,\nconnecté.',
    body: 'Joueurs uniquement. Mercato local, matchs et candidatures au même endroit.',
    image: SHOWCASE_IMAGES.discoverHero,
    icon: 'home',
    cta: 'Voir le live',
    action: 'live',
  },
  {
    id: 'modules',
    kicker: 'VOS PILIERS',
    title: 'Club, matchs,\nMercato.',
    body: 'Effectif, convocations, covoiturage et Mercato Amateur. Tout pour votre saison locale.',
    image: SHOWCASE_IMAGES.mercatoDetection,
    icon: 'search',
    cta: 'Voir les pôles',
    action: 'modules',
  },
  {
    id: 'join',
    kicker: 'REJOINDRE',
    title: 'Compte\ngratuit.',
    body: 'Inscription joueur (Homme / Femme) en quelques minutes. Coach ? Pôle Staff.',
    image: SHOWCASE_IMAGES.playerProfile,
    icon: 'person',
    cta: 'Créer mon compte',
    action: 'signup',
  },
];

export const DISCOVER_UNIVERSE_CARDS_AMATEUR = [
  {
    id: 'recrutement' as const,
    title: 'Mercato Amateur',
    subtitle: 'Annonces & candidatures',
    image: SHOWCASE_IMAGES.mercatoDetection,
    icon: 'search' as IconName,
    accent: AMATEUR_ORANGE.primary,
  },
  {
    id: 'matchs' as const,
    title: 'Matchs',
    subtitle: 'Amicaux & convocations',
    image: SHOWCASE_IMAGES.friendlyMatch,
    icon: 'handshake' as IconName,
    accent: AMATEUR_ORANGE.dark,
  },
  {
    id: 'gestion' as const,
    title: 'Effectif',
    subtitle: 'Coach & convocations',
    image: SHOWCASE_IMAGES.coachFounder,
    icon: 'people' as IconName,
    accent: AMATEUR_ORANGE.mid,
  },
];
