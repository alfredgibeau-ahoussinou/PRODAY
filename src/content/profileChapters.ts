import type { UserRole } from '../models/User';

export type ProfileChapterId = 'apercu' | 'cv' | 'activite' | 'reglages';

export function getProfileChapters(role: UserRole): { id: ProfileChapterId; label: string }[] {
  return [
    { id: 'apercu', label: 'Compte' },
    { id: 'cv', label: role === 'player' ? 'Vitrine' : 'Parcours' },
    { id: 'activite', label: 'Activité' },
    { id: 'reglages', label: 'Paramètres' },
  ];
}
