import type { IconName } from '../components/ui/iconNames';

export type ClubChannelId = 'general' | 'mercato' | 'covoit' | 'convocations';

export type ClubCommunityChannel = {
  id: ClubChannelId;
  label: string;
  icon: IconName;
  description: string;
};

/** Salons thématiques club — grille Communauté. */
export const CLUB_COMMUNITY_CHANNELS: ClubCommunityChannel[] = [
  {
    id: 'general',
    label: 'Général',
    icon: 'chat',
    description: 'Annonces et discussions club',
  },
  {
    id: 'mercato',
    label: 'Mercato',
    icon: 'briefcase',
    description: 'Recrutement et détections',
  },
  {
    id: 'covoit',
    label: 'Covoiturage',
    icon: 'car',
    description: 'Trajets vers matchs et stages',
  },
  {
    id: 'convocations',
    label: 'Convocations',
    icon: 'calendar',
    description: 'Événements et RSVP',
  },
];
