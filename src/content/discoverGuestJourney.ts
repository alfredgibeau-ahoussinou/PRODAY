import type { IconName } from '../components/ui/Icon';
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
  const brand = getUniverseIdentity(line);

  if (line === 'sante') {
    return [
      { id: 'profile', title: 'Cabinet', body: 'Profil praticien', icon: 'heart' },
      { id: 'mercato', title: 'Annuaire', body: 'Clubs & sportifs', icon: 'search' },
      { id: 'season', title: 'Agenda', body: 'Rendez-vous', icon: 'calendar' },
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
