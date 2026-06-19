import type { IconName } from '../components/ui/Icon';
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

export const DISCOVER_INTRO_SLIDES_PRO: DiscoverIntroSlidePro[] = [
  {
    id: 'welcome',
    kicker: 'PRODAY PRO',
    title: 'Les pros\ndu foot.',
    body: 'Coach, agent et pôle santé — recrutement vérifié et réseau clubs.',
    image: SHOWCASE_IMAGES.coachFounder,
    icon: 'school',
    cta: 'Voir le live',
    action: 'live',
  },
  {
    id: 'modules',
    kicker: 'RÉSEAU PRO',
    title: 'Expertise.\nContacts.',
    body: 'Mercato Pro, mandats agent, accompagnement santé — tout l’écosystème pro.',
    image: SHOWCASE_IMAGES.expTeam,
    icon: 'briefcase',
    cta: 'Les modules',
    action: 'modules',
  },
  {
    id: 'join',
    kicker: 'REJOINDRE',
    title: 'Votre compte\nPro.',
    body: 'Inscription coach, agent ou praticien — validation métier incluse.',
    image: SHOWCASE_IMAGES.expMessages,
    icon: 'person',
    cta: 'Commencer',
    action: 'signup',
  },
];

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
    subtitle: 'Sponsors & visibilité',
    image: SHOWCASE_IMAGES.coachFounder,
    icon: 'star-four-points' as IconName,
    accent: '#F59E0B',
  },
];
