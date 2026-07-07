import type { IconName } from '../components/ui/Icon';
import type { IntroSlideAction } from './discoverChapters';
import { SHOWCASE_IMAGES } from './showcaseAssets';

export const SUPPORTER_VIOLET = {
  primary: '#7C3AED',
  dark: '#5B21B6',
  mid: '#6D28D9',
  light: '#8B5CF6',
} as const;

export const DISCOVER_INTRO_SLIDES_SUPPORTER = [
  {
    id: 'welcome',
    kicker: 'PRO DAY SUPPORTER',
    title: 'Le foot,\nensemble.',
    body: 'Suivez les matchs, vibrez sur les réels et rejoignez la communauté.',
    image: SHOWCASE_IMAGES.discoverHero,
    icon: 'home' as IconName,
    cta: 'Voir le live',
    action: 'live' as IntroSlideAction,
  },
  {
    id: 'modules',
    kicker: 'TRIBUNE',
    title: 'Matchs &\nréels.',
    body: 'Calendrier, moments forts et fil communautaire — votre place en tribune numérique.',
    image: SHOWCASE_IMAGES.friendlyMatch,
    icon: 'videocam' as IconName,
    cta: 'Explorer la tribune',
    action: 'modules' as IntroSlideAction,
  },
  {
    id: 'join',
    kicker: 'REJOINDRE',
    title: 'Compte\ngratuit.',
    body: 'Inscription supporter en quelques minutes.',
    image: SHOWCASE_IMAGES.playerProfile,
    icon: 'person' as IconName,
    cta: 'Créer mon compte',
    action: 'signup' as IntroSlideAction,
  },
];

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
