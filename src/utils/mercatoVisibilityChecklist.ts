import type { User } from '../models/User';

export type MercatoChecklistStepId =
  | 'photo'
  | 'identity'
  | 'stats'
  | 'bio'
  | 'media';

export interface MercatoChecklistStep {
  id: MercatoChecklistStepId;
  label: string;
  hint: string;
  done: boolean;
}

export function getMercatoVisibilityChecklist(user: User): {
  steps: MercatoChecklistStep[];
  completedCount: number;
  percent: number;
  isVisibleReady: boolean;
} {
  const p = user.profile;
  const stats = p.season_stats;
  const hasStats = Boolean(stats && (stats.matches > 0 || stats.goals > 0 || stats.assists > 0));
  const hasMedia =
    Boolean(user.avatar_url) ||
    (p.gallery_urls?.filter(Boolean).length ?? 0) > 0 ||
    (p.highlight_video_urls?.filter(Boolean).length ?? 0) > 0;

  const steps: MercatoChecklistStep[] = [
    {
      id: 'photo',
      label: 'Photo de profil',
      hint: 'Ajoute une photo claire et récente',
      done: Boolean(user.avatar_url),
    },
    {
      id: 'identity',
      label: 'Identité sportive',
      hint: 'Poste, catégorie, niveau et ville',
      done: Boolean(p.position?.trim() && p.category?.trim() && p.level?.trim() && user.city?.trim()),
    },
    {
      id: 'stats',
      label: 'Stats saison',
      hint: 'Matchs, buts et passes décisives',
      done: hasStats,
    },
    {
      id: 'bio',
      label: 'Bio & accroche',
      hint: 'Présente ton profil en quelques lignes',
      done: Boolean(p.bio?.trim() || p.cv_headline?.trim()),
    },
    {
      id: 'media',
      label: 'Galerie ou highlight',
      hint: 'Au moins une photo ou vidéo',
      done: hasMedia,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const percent = Math.round((completedCount / steps.length) * 100);

  return {
    steps,
    completedCount,
    percent,
    isVisibleReady: completedCount >= 4,
  };
}
