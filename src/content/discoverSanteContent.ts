import type { IconName } from '../components/ui/Icon';
import type { IntroSlideAction } from './discoverChapters';
import type { DiscoverUniverseCard } from './discoverChapters';
import { SHOWCASE_IMAGES } from './showcaseAssets';

export const DISCOVER_INTRO_SLIDES_SANTE = [
  {
    id: 'welcome',
    kicker: 'PRO DAY SANTÉ',
    title: 'La santé\nau service du jeu.',
    body: 'Praticiens du sport — agenda, messagerie sécurisée et visibilité auprès des clubs.',
    image: SHOWCASE_IMAGES.coachFounder,
    icon: 'heart' as IconName,
    cta: 'Voir l’annuaire',
    action: 'modules' as IntroSlideAction,
  },
  {
    id: 'patients',
    kicker: 'CABINET',
    title: 'Sportifs\nsuivis.',
    body: 'Messagerie sécurisée, dossiers patients et demandes de soins à proximité.',
    image: SHOWCASE_IMAGES.playerProfile,
    icon: 'chat' as IconName,
    cta: 'Voir les pôles',
    action: 'modules' as IntroSlideAction,
  },
  {
    id: 'join',
    kicker: 'REJOINDRE',
    title: 'Votre compte\nSanté.',
    body: 'Inscription praticien — validation diplôme incluse.',
    image: SHOWCASE_IMAGES.mercatoDetection,
    icon: 'person' as IconName,
    cta: 'Créer mon compte',
    action: 'signup' as IntroSlideAction,
  },
] as const;

export const DISCOVER_UNIVERSE_CARDS_SANTE: DiscoverUniverseCard[] = [
  {
    id: 'gestion',
    title: 'Agenda',
    subtitle: 'RDV et disponibilités',
    image: SHOWCASE_IMAGES.coachFounder,
    icon: 'calendar',
    accent: '#0F766E',
  },
  {
    id: 'matchs',
    title: 'Patients',
    subtitle: 'Messagerie sécurisée',
    image: SHOWCASE_IMAGES.playerProfile,
    icon: 'chat',
    accent: '#14B8A6',
  },
  {
    id: 'sponsors',
    title: 'Visibilité',
    subtitle: 'Clubs et joueurs proches',
    image: SHOWCASE_IMAGES.mercatoDetection,
    icon: 'heart',
    accent: '#115E59',
  },
];
