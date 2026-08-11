import type { IconName } from '../components/ui/iconNames';
import type { ProductLineId } from '../models/ProductLine';
import { getUniverseIdentity } from './brandExperience';

export type DiscoverJourneyStepId = 'profile' | 'mercato' | 'season';

export type DiscoverJourneyStep = {
  id: DiscoverJourneyStepId;
  title: string;
  body: string;
  icon: IconName;
};

export function getDiscoverGuestJourneySteps(line: ProductLineId): DiscoverJourneyStep[] {
  const brand = getUniverseIdentity(line === 'sante' ? 'amateur' : line);

  // Legacy deep-link pôle Santé → parcours guest Joueur (sans module Soins).
  if (line === 'sante') {
    return [
      { id: 'profile', title: 'Profil joueur', body: 'Identité & CV', icon: 'person' },
      { id: 'mercato', title: brand.mercatoLabel, body: 'Club & opportunités', icon: 'search' },
      { id: 'season', title: 'Saison', body: 'Matchs & entraînements', icon: 'calendar' },
    ];
  }

  if (line === 'sponsor') {
    return [
      { id: 'profile', title: 'Espace marque', body: 'Identité & offres', icon: 'star-four-points' },
      { id: 'mercato', title: 'Campagnes', body: 'Visibilité & ROI', icon: 'briefcase' },
      { id: 'season', title: 'Réseau clubs', body: 'Prospects & messages', icon: 'people' },
    ];
  }

  if (line === 'pro') {
    return [
      { id: 'profile', title: 'Profil staff', body: 'Coach, club, agent', icon: 'school' },
      { id: 'mercato', title: brand.mercatoLabel, body: 'Annonces & candidatures', icon: 'search' },
      { id: 'season', title: 'Saison', body: 'Matchs & convocations', icon: 'calendar' },
    ];
  }

  return [
    { id: 'profile', title: 'Profil', body: brand.cvLabel, icon: 'person' },
    { id: 'mercato', title: brand.mercatoLabel, body: 'Annonces & candidatures', icon: 'search' },
    { id: 'season', title: 'Saison', body: 'Matchs & équipe', icon: 'calendar' },
  ];
}
