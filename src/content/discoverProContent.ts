import type { IconName } from '../components/ui/iconNames';
import type { IntroSlideAction } from './discoverChapters';
import { SHOWCASE_IMAGES } from './showcaseAssets';

export interface DiscoverIntroSlidePro {
  id: string;
  kicker: string;
  title: string;
  body: string;
  image: number;
  icon: IconName;
  cta: string;
  action: IntroSlideAction;
}

export const DISCOVER_INTRO_SLIDES_PRO_PLAYER: DiscoverIntroSlidePro[] = [
  {
    id: 'welcome',
    kicker: 'PRO JOUEUR',
    title: 'Votre carrière\npro.',
    body: 'Portfolio, opportunités et convocations. Votre cockpit de joueur professionnel.',
    image: SHOWCASE_IMAGES.playerProfile,
    icon: 'person',
    cta: 'Voir le live',
    action: 'live',
  },
  {
    id: 'modules',
    kicker: 'VOS PILIERS',
    title: 'Carrière &\nopportunités.',
    body: 'Mercato Pro, mandat agent, groupe et logistique. Tout pour performer au plus haut niveau.',
    image: SHOWCASE_IMAGES.mercatoDetection,
    icon: 'briefcase',
    cta: 'Voir les pôles',
    action: 'modules',
  },
  {
    id: 'join',
    kicker: 'REJOINDRE',
    title: 'Votre compte\nPro Joueur.',
    body: 'Inscription joueur professionnel. Validation métier incluse.',
    image: SHOWCASE_IMAGES.expMessages,
    icon: 'person',
    cta: 'Créer mon compte',
    action: 'signup',
  },
];

export const DISCOVER_INTRO_SLIDES_PRO_CLUB: DiscoverIntroSlidePro[] = [
  {
    id: 'welcome',
    kicker: 'PRO CLUB',
    title: 'Votre structure\nconnectée.',
    body: 'Équipes, recrutement local, calendrier et communication. La vitrine digitale du club.',
    image: SHOWCASE_IMAGES.coachFounder,
    icon: 'school',
    cta: 'Voir le live',
    action: 'live',
  },
  {
    id: 'modules',
    kicker: 'VOS PILIERS',
    title: 'Effectifs &\nrecrutement.',
    body: 'Mercato Pro, convocations, annonces et visibilité. Pilotez votre structure au quotidien.',
    image: SHOWCASE_IMAGES.expTeam,
    icon: 'people',
    cta: 'Voir les pôles',
    action: 'modules',
  },
  {
    id: 'join',
    kicker: 'REJOINDRE',
    title: 'Votre compte\nPro Club.',
    body: 'Inscription club ou structure. Validation métier incluse.',
    image: SHOWCASE_IMAGES.expMessages,
    icon: 'person',
    cta: 'Créer mon compte',
    action: 'signup',
  },
];

export const DISCOVER_INTRO_SLIDES_PRO_STAFF: DiscoverIntroSlidePro[] = [
  {
    id: 'welcome',
    kicker: 'COACH',
    title: 'Le staff\nau centre.',
    body: 'Coach, agent, recruteur ou organisateur. Mandats, scouting et réseau pro vérifié.',
    image: SHOWCASE_IMAGES.coachFounder,
    icon: 'school',
    cta: 'Voir le live',
    action: 'live',
  },
  {
    id: 'modules',
    kicker: 'VOS PILIERS',
    title: 'Métier &\nréseau.',
    body: 'Mercato Pro, mandats agent, scouting et convocations. Les outils de votre métier.',
    image: SHOWCASE_IMAGES.expTeam,
    icon: 'briefcase',
    cta: 'Voir les pôles',
    action: 'modules',
  },
  {
    id: 'join',
    kicker: 'REJOINDRE',
    title: 'Votre compte\nCoach.',
    body: 'Inscription coach, agent ou recruteur. Validation métier incluse.',
    image: SHOWCASE_IMAGES.expMessages,
    icon: 'person',
    cta: 'Créer mon compte',
    action: 'signup',
  },
];

/** @deprecated Préférer les variantes pro_player / pro_club / pro_staff */
export const DISCOVER_INTRO_SLIDES_PRO: DiscoverIntroSlidePro[] = DISCOVER_INTRO_SLIDES_PRO_STAFF;

export const DISCOVER_UNIVERSE_CARDS_PRO = [
  {
    id: 'recrutement' as const,
    title: 'Mercato Pro',
    subtitle: 'Recrutement vérifié',
    image: SHOWCASE_IMAGES.mercatoDetection,
    icon: 'search' as IconName,
    accent: '#1D4ED8',
  },
  {
    id: 'matchs' as const,
    title: 'Effectifs',
    subtitle: 'Convocations & équipes',
    image: SHOWCASE_IMAGES.expTeam,
    icon: 'people' as IconName,
    accent: '#1E3A8A',
  },
  {
    id: 'gestion' as const,
    title: 'Réseau',
    subtitle: 'Clubs & mandats agent',
    image: SHOWCASE_IMAGES.coachFounder,
    icon: 'briefcase' as IconName,
    accent: '#2563EB',
  },
  {
    id: 'sponsors' as const,
    title: 'Sponsors',
    subtitle: 'Visibilité & partenariats',
    image: SHOWCASE_IMAGES.coachFounder,
    icon: 'star-four-points' as IconName,
    accent: '#F59E0B',
  },
];
