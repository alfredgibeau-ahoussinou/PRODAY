import type { UserRole } from '../models/User';
import type { TranslateFn } from '../i18n/types';

export type ProfileChapterId = 'apercu' | 'cv' | 'activite' | 'reglages';

export function getProfileChapters(
  role: UserRole,
  t?: TranslateFn,
): { id: ProfileChapterId; label: string }[] {
  const label = (key: string, fallback: string) => (t ? t(key) : fallback);
  if (role === 'player') {
    return [
      { id: 'apercu', label: 'COMPTE' },
      { id: 'cv', label: 'VITRINE' },
      { id: 'activite', label: 'ACTIVITÉ' },
      { id: 'reglages', label: 'RÉGLAGES' },
    ];
  }
  return [
    { id: 'apercu', label: label('profile.chapters.account', 'Compte') },
    { id: 'cv', label: label('profile.chapters.career', 'Parcours') },
    { id: 'activite', label: label('profile.chapters.activity', 'Activité') },
    { id: 'reglages', label: label('profile.chapters.settings', 'Paramètres') },
  ];
}
