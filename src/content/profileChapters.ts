import type { UserRole } from '../models/User';
import type { TranslateFn } from '../i18n/types';

export type ProfileChapterId = 'apercu' | 'cv' | 'activite' | 'reglages';

export function getProfileChapters(
  role: UserRole,
  t?: TranslateFn,
): { id: ProfileChapterId; label: string }[] {
  const label = (key: string, fallback: string) => (t ? t(key) : fallback);
  return [
    { id: 'apercu', label: label('profile.chapters.account', 'Compte') },
    {
      id: 'cv',
      label:
        role === 'player'
          ? label('profile.chapters.showcase', 'Vitrine')
          : label('profile.chapters.career', 'Parcours'),
    },
    { id: 'activite', label: label('profile.chapters.activity', 'Activité') },
    { id: 'reglages', label: label('profile.chapters.settings', 'Paramètres') },
  ];
}
