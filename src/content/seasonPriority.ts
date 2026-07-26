import type { CarouselPoleId } from '../models/CarouselPole';
import type { UserRole } from '../models/User';

/** Priorité choisie à la première ouverture (onboarding). */
export type SeasonPriorityId =
  | 'find_club'
  | 'manage_team'
  | 'manage_club'
  | 'organize_tournament';

export interface SeasonPriorityOption {
  id: SeasonPriorityId;
  label: string;
  hint: string;
  pole: CarouselPoleId;
  presetRole: UserRole | null;
}

export const SEASON_PRIORITY_STORAGE_KEY = 'proday_season_priority_v1';

export const SEASON_PRIORITY_OPTIONS: SeasonPriorityOption[] = [
  {
    id: 'find_club',
    label: 'Trouver un club / être recruté',
    hint: 'CV, opportunités et visibilité joueur',
    pole: 'pro_player',
    presetRole: 'player',
  },
  {
    id: 'manage_team',
    label: 'Gérer mon équipe et recruter',
    hint: 'Effectif, convocations et banc technique',
    pole: 'pro_staff',
    presetRole: 'coach',
  },
  {
    id: 'manage_club',
    label: 'Gérer un club',
    hint: 'Image, structure, annonces et partenariats',
    pole: 'pro_club',
    presetRole: 'club',
  },
  {
    id: 'organize_tournament',
    label: 'Organiser un tournoi',
    hint: 'Événements, détections et calendrier local',
    pole: 'pro_staff',
    presetRole: 'organizer',
  },
];

export function seasonPriorityById(id: SeasonPriorityId): SeasonPriorityOption | undefined {
  return SEASON_PRIORITY_OPTIONS.find((option) => option.id === id);
}
