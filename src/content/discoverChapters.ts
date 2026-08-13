import type { IconName } from '../components/ui/iconNames';
import type { ProDayModuleId } from './prodayModules';
import { SHOWCASE_IMAGES } from './showcaseAssets';

export interface DiscoverUniverseCard {
  id: ProDayModuleId;
  title: string;
  subtitle: string;
  image: number;
  icon: IconName;
  accent: string;
}

export const DISCOVER_UNIVERSE_CARDS: DiscoverUniverseCard[] = [
  {
    id: 'recrutement',
    title: 'Mercato',
    subtitle: 'Annonces & candidatures',
    image: SHOWCASE_IMAGES.mercatoDetection,
    icon: 'search',
    accent: '#0A0A0A',
  },
  {
    id: 'matchs',
    title: 'Matchs',
    subtitle: 'Amicaux & convocations',
    image: SHOWCASE_IMAGES.friendlyMatch,
    icon: 'handshake',
    accent: '#262626',
  },
  {
    id: 'smart_tactics',
    title: 'Tactique IA',
    subtitle: 'Board · readiness · IA',
    image: SHOWCASE_IMAGES.coachFounder,
    icon: 'football',
    accent: '#1B5E20',
  },
  {
    id: 'sponsors',
    title: 'Sponsors',
    subtitle: 'Sponsors & financement',
    image: SHOWCASE_IMAGES.coachFounder,
    icon: 'star',
    accent: '#737373',
  },
];
