import type { ShowcaseImageKey } from './showcaseAssets';

/** Contenu éditorial ProDay (info produit — pas de données inventées). */
export const PRODAY_INFO_SECTIONS = [
  {
    id: 'pulse',
    title: 'Pulse ProDay',
    summary: 'Votre score de visibilité',
    body: 'Le Pulse combine complétion du profil, stats saison, candidatures et convocations. Plus il monte, plus vous êtes visible des clubs et coachs.',
    tips: ['Complétez bio + photo', 'Jouez et saisissez vos stats', 'Postulez aux annonces'],
  },
  {
    id: 'cv',
    title: 'CV vivant',
    summary: 'Export PDF en un geste',
    body: 'Chaque match alimente votre fiche : buts, passes, cartons. Exportez un CV foot professionnel depuis votre profil.',
    tips: ['Live Stats après match', 'Galerie photos', 'Vidéos highlights'],
  },
  {
    id: 'season',
    title: 'Saison 360°',
    summary: 'Tout au même endroit',
    body: 'Convocations, matchs amicaux, détections et tournois Arena partagent le même calendrier — fini les groupes WhatsApp éparpillés.',
    tips: ['RSVP convocations', 'Relances coach', 'Arena tournois'],
  },
  {
    id: 'trust',
    title: 'Confiance ProDay',
    summary: 'Staff certifié',
    body: 'Coachs et agents validés avant messagerie complète. Contrôle parental pour les comptes mineurs.',
    tips: ['Badge vérifié', 'Documents diplômes', 'Contacts approuvés'],
  },
] as const;

export const FEATURE_IMAGE_KEYS: Record<string, ShowcaseImageKey> = {
  recruit: 'mercatoDetection',
  cv: 'playerProfile',
  matches: 'friendlyMatch',
  verify: 'coachFounder',
  team: 'mercatoDetection',
  arena: 'arenaTournament',
};

export const FOUNDER_IMAGE_KEYS: Record<string, ShowcaseImageKey> = {
  alfred: 'coachFounder',
  yoan: 'arenaTournament',
  yanis: 'playerProfile',
  equipe: 'friendlyMatch',
};
