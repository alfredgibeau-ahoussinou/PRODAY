import type { DiscoverUniverseCard } from './discoverChapters';
import { SHOWCASE_IMAGES } from './showcaseAssets';

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
