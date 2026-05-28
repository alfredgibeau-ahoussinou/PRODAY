import type { User } from '../models/User';

export interface ProfileCompletionItem {
  id: string;
  label: string;
  done: boolean;
  weight: number;
}

export interface ProfileCompletionResult {
  percent: number;
  items: ProfileCompletionItem[];
  missingLabels: string[];
}

/** Calcule la complétion du profil selon les critères ProDay. */
export function getProfileCompletion(user: User): ProfileCompletionResult {
  const p = user.profile;
  const items: ProfileCompletionItem[] = [];

  const add = (id: string, label: string, done: boolean, weight: number) => {
    items.push({ id, label, done, weight });
  };

  add('name', 'Nom affiché', Boolean(user.display_name?.trim()), 10);
  add('city', 'Ville', Boolean(user.city?.trim()), 10);
  add('avatar', 'Photo de profil', Boolean(user.avatar_url), 15);

  if (user.role === 'player') {
    add('position', 'Poste', Boolean(p.position?.trim()), 12);
    add('category', 'Catégorie', Boolean(p.category?.trim()), 8);
    add('level', 'Niveau', Boolean(p.level?.trim()), 8);
    const stats = p.season_stats;
    const hasStats =
      Boolean(stats) &&
      (stats!.matches > 0 || stats!.goals > 0 || stats!.assists > 0);
    add('stats', 'Stats saison', hasStats, 12);
    add('bio', 'Bio', Boolean(p.bio?.trim()), 10);
    add('videos', 'Vidéo highlight', (p.highlight_video_urls?.filter(Boolean).length ?? 0) > 0, 5);
    const hasMedia =
      (p.gallery_urls?.filter(Boolean).length ?? 0) > 0 ||
      (p.highlight_video_urls?.filter(Boolean).length ?? 0) > 0;
    add('media', 'Photo ou vidéo', hasMedia, 15);
  } else if (user.role === 'coach' || user.role === 'agent') {
    add('bio', 'Présentation', Boolean(p.bio?.trim()), 15);
    add('diploma', 'Diplôme / licence', Boolean(p.diploma?.trim() || p.license_number?.trim()), 20);
    add('verify', 'Document vérifié', user.verification_status === 'VERIFIED', 25);
    add('specialties', 'Spécialités', (p.specialties?.length ?? 0) > 0, 10);
  } else {
    add('bio', 'Description', Boolean(p.bio?.trim()), 20);
    add('club', 'Club lié', Boolean(p.club_id), 30);
  }

  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  const doneWeight = items.filter((i) => i.done).reduce((s, i) => s + i.weight, 0);
  const percent = totalWeight > 0 ? Math.round((doneWeight / totalWeight) * 100) : 0;
  const missingLabels = items.filter((i) => !i.done).map((i) => i.label);

  return { percent, items, missingLabels };
}
