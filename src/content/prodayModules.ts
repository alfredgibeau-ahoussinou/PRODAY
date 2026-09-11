import type { IconName } from '../components/ui/iconNames';

export type ProDayModuleId =
  | 'recrutement'
  | 'matchs'
  | 'gestion'
  | 'smart_tactics'
  | 'sponsors';

export interface ProDayModuleDef {
  id: ProDayModuleId;
  icon: IconName;
  title: string;
  subtitle: string;
}

/** Grille modules — alignée maquettes `docs/design/mockups/index.html` */
export const PRODAY_MODULES: ProDayModuleDef[] = [
  { id: 'recrutement', icon: 'search', title: 'Recrutement', subtitle: 'Joueurs & clubs' },
  { id: 'matchs', icon: 'calendar', title: 'Matchs', subtitle: 'Calendrier' },
  { id: 'gestion', icon: 'people', title: 'Gestion équipe', subtitle: 'Planning · présences · stats' },
  {
    id: 'smart_tactics',
    icon: 'football',
    title: 'Tactique IA',
    subtitle: 'Board · readiness · IA · vidéo',
  },
  {
    id: 'sponsors',
    icon: 'star',
    title: 'Sponsors',
    subtitle: 'Depuis l’Accueil · offres & financement',
  },
];
