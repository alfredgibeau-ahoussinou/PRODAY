import type { IconName } from '../components/ui/iconNames';
import { SHOWCASE_IMAGES } from './showcaseAssets';

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
