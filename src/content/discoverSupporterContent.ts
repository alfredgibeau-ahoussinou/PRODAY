import type { IconName } from '../components/ui/iconNames';
import { SHOWCASE_IMAGES } from './showcaseAssets';

export const SUPPORTER_VIOLET = {
  primary: '#7C3AED',
  dark: '#5B21B6',
  mid: '#6D28D9',
  light: '#8B5CF6',
} as const;

export const DISCOVER_UNIVERSE_CARDS_SUPPORTER = [
  {
    id: 'matchs' as const,
    title: 'Matchs & tournois',
    subtitle: 'Calendrier, live & compétitions',
    image: SHOWCASE_IMAGES.arenaTournament,
    icon: 'trophy' as IconName,
    accent: SUPPORTER_VIOLET.primary,
  },
  {
    id: 'gestion' as const,
    title: 'Fil',
    subtitle: 'Communauté & actu',
    image: SHOWCASE_IMAGES.coachFounder,
    icon: 'star-four-points' as IconName,
    accent: SUPPORTER_VIOLET.mid,
  },
  {
    id: 'recrutement' as const,
    title: 'Joueurs',
    subtitle: 'Parcourir les profils',
    image: SHOWCASE_IMAGES.mercatoDetection,
    icon: 'people' as IconName,
    accent: SUPPORTER_VIOLET.dark,
  },
  {
    id: 'sponsors' as const,
    title: 'Shop',
    subtitle: 'Goodies & équipement',
    image: SHOWCASE_IMAGES.expSponsors,
    icon: 'bag' as IconName,
    accent: SUPPORTER_VIOLET.light,
  },
];
