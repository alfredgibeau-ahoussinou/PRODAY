/**
 * Chapitres opérationnels du portail Club (app connectée).
 * Moins de marketing, plus de décisions.
 */

export type ClubPortalChapterId =
  | 'aujourdhui'
  | 'structure'
  | 'vivier'
  | 'competition'
  | 'outils';

export const CLUB_PORTAL_CHAPTERS: {
  id: ClubPortalChapterId;
  label: string;
  shortLabel: string;
  support: string;
}[] = [
  {
    id: 'aujourdhui',
    label: 'Aujourd’hui',
    shortLabel: 'Aujourd’hui',
    support: 'Priorités, décisions, raccourcis utiles.',
  },
  {
    id: 'structure',
    label: 'Structure',
    shortLabel: 'Structure',
    support: 'Équipes, coachs, adhésions.',
  },
  {
    id: 'vivier',
    label: 'Vivier',
    shortLabel: 'Vivier',
    support: 'Bourse interne puis mercato.',
  },
  {
    id: 'competition',
    label: 'Compétition',
    shortLabel: 'Compétition',
    support: 'Matchs, tournois, organisation.',
  },
  {
    id: 'outils',
    label: 'Outils',
    shortLabel: 'Outils',
    support: 'Vidéo, offres, équipements, sponsors.',
  },
];
