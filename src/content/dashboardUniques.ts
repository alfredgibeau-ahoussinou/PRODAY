import type { IconName } from '../components/ui/Icon';
import type { UserRole } from '../models/User';

export type ProdayUniqueId =
  | 'pulse'
  | 'cv-live'
  | 'trust'
  | 'season'
  | 'live'
  | 'detect'
  | 'arena';

/** Fonctionnalités exclusives ProDay — signature produit. */
export const PRODAY_UNIQUES: {
  id: ProdayUniqueId;
  title: string;
  subtitle: string;
  description: string;
  icon: IconName;
}[] = [
  {
    id: 'pulse',
    title: 'Pulse ProDay',
    subtitle: 'Score de visibilité',
    description: 'Un indicateur unique qui combine profil, stats et confiance.',
    icon: 'star-four-points' as IconName,
  },
  {
    id: 'cv-live',
    title: 'CV vivant',
    subtitle: 'Stats → PDF',
    description: 'Vos buts et passes alimentent un CV foot exportable.',
    icon: 'document' as IconName,
  },
  {
    id: 'trust',
    title: 'Double confiance',
    subtitle: 'Staff vérifié',
    description: 'Coachs et agents validés avant messagerie complète.',
    icon: 'shield' as IconName,
  },
  {
    id: 'season',
    title: 'Saison 360°',
    subtitle: 'Tout-en-un',
    description: 'Recrutement, convocations, matchs amicaux et Arena.',
    icon: 'calendar' as IconName,
  },
  {
    id: 'live',
    title: 'Live → Profil',
    subtitle: 'Stats match',
    description: 'Saisie live qui met à jour votre saison automatiquement.',
    icon: 'time' as IconName,
  },
  {
    id: 'detect',
    title: 'Détections',
    subtitle: 'Intégrées',
    description: 'Journées de scouting dans le même calendrier que votre club.',
    icon: 'football' as IconName,
  },
  {
    id: 'arena',
    title: 'Arena ProDay',
    subtitle: 'Tournois locaux',
    description: 'Inscrivez votre club, suivez le palmarès et brillez en fin de saison.',
    icon: 'trophy' as IconName,
  },
] as const;

export const ROLE_DASHBOARD_TAGLINE: Record<UserRole, string> = {
  player: 'Votre carrière, un seul cockpit.',
  coach: 'Pilotez votre effectif et vos convocations.',
  agent: 'Repérez, convoquez, placez.',
  organizer: 'Animez tournois et écosystème local.',
  sponsor: 'Soutenez les clubs de votre territoire.',
  physio: 'Prévention, récupération, fil ProDay.',
};
