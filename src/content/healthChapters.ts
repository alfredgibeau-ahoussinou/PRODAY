import type { IconName } from '../components/ui/iconNames';

export type HealthChapterId =
  | 'kine_osteo'
  | 'medecin_prepa'
  | 'mental'
  | 'nutrition'
  | 'podologie'
  | 'conseils';

export type HealthChapterDef = {
  id: HealthChapterId;
  label: string;
  shortLabel: string;
  tag: string;
  icon: IconName;
};

export const HEALTH_CHAPTERS: HealthChapterDef[] = [
  {
    id: 'kine_osteo',
    label: 'Kiné & ostéo',
    shortLabel: 'Kiné',
    tag: 'Kiné · Ostéo',
    icon: 'walk',
  },
  {
    id: 'medecin_prepa',
    label: 'Médecin & prépa',
    shortLabel: 'Médecin',
    tag: 'Médecin · Prépa',
    icon: 'shield',
  },
  {
    id: 'mental',
    label: 'Coach mental',
    shortLabel: 'Mental',
    tag: 'Coach mental',
    icon: 'school',
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    shortLabel: 'Nutrition',
    tag: 'Alimentation',
    icon: 'heart',
  },
  {
    id: 'podologie',
    label: 'Podologie',
    shortLabel: 'Podologie',
    tag: 'Pied & appui',
    icon: 'football',
  },
  {
    id: 'conseils',
    label: 'Conseils',
    shortLabel: 'Conseils',
    tag: 'Bien-être',
    icon: 'star-four-points',
  },
];

export function healthChapterToPoleGroup(
  chapter: HealthChapterId
): 'kine_osteo' | 'medecin_prepa' | 'mental' | 'nutrition' | 'podologie' | null {
  if (chapter === 'conseils') return null;
  return chapter;
}
