import type { IconName } from '../components/ui/iconNames';
import { SHOWCASE_IMAGES } from './showcaseAssets';

export const AMATEUR_ORANGE = {
  primary: '#EA580C',
  dark: '#9A3412',
  mid: '#C2410C',
  light: '#F97316',
} as const;

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
