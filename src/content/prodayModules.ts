import type { IconName } from '../components/ui/Icon';

export type ProDayModuleId =
  | 'recrutement'
  | 'matchs'
  | 'gestion'
  | 'arena'
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
  { id: 'matchs', icon: 'calendar', title: 'Matchs', subtitle: 'Amicaux' },
  { id: 'gestion', icon: 'people', title: 'Gestion équipe', subtitle: 'Planning · présence · caisse' },
  { id: 'arena', icon: 'trophy', title: 'Arena', subtitle: 'Tournois' },
  { id: 'sponsors', icon: 'star', title: 'Sponsors', subtitle: 'Partenaires' },
];
