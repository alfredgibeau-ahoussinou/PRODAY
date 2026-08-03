import type { IconName } from '../components/ui/Icon';
import type { UserRole } from '../models/User';

export type ProdayUniqueId =
  | 'pulse'
  | 'cv-live'
  | 'trust'
  | 'season'
  | 'live'
  | 'detect';

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
    title: 'Visibilité ProDay',
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
    description: 'Recrutement, convocations et matchs amicaux.',
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
] as const;

export const ROLE_DASHBOARD_TAGLINE: Record<UserRole, string> = {
  player: 'Votre carrière, un seul espace.',
  coach: 'Pilotez votre effectif et vos convocations.',
  club: 'Stages, recrutement et vie de club.',
  agent: 'Repérez, convoquez, placez.',
  recruiter: 'Scouting, annonces Mercato et suivi candidatures.',
  organizer: 'Animez détections et réseau local.',
  sponsor: 'Soutenez les clubs de votre territoire.',
  supporter: 'Matchs, réels et communauté. Votre tribune ProDay.',
  physio: 'Kiné, ostéo, médecin du sport. Fil ProDay.',
  parent: 'Supervisez profil, messages, agenda et trajets.',
};
