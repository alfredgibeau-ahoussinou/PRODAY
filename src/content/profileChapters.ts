import type { UserRole } from '../models/User';
import type { TranslateFn } from '../i18n/types';

export type ProfileChapterId = 'apercu' | 'cv' | 'activite' | 'reglages';

export function getProfileChapters(
  role: UserRole,
  t?: TranslateFn,
): { id: ProfileChapterId; label: string; icon?: string; activeIcon?: string }[] {
  const label = (key: string, fallback: string) => (t ? t(key) : fallback);
  return [
    {
      id: 'apercu',
      label: label('profile.chapters.account', 'Compte'),
      icon: 'person-circle-outline',
      activeIcon: 'person-circle',
    },
    {
      id: 'cv',
      label: label('profile.chapters.career', 'Parcours'),
      icon: 'briefcase-outline',
      activeIcon: 'briefcase',
    },
    {
      id: 'activite',
      label: label('profile.chapters.activity', 'Activité'),
      icon: 'pulse-outline',
      activeIcon: 'pulse',
    },
    {
      id: 'reglages',
      label: label('profile.chapters.settings', 'Paramètres'),
      icon: 'settings-outline',
      activeIcon: 'settings',
    },
  ];
}
