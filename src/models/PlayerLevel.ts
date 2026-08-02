/**
 * Niveau joueur — badges du Pôle Joueur unifié (amateur → centre → pro).
 * Le profil reste le même ; seul le badge évolue à la signature pro.
 */

export type PlayerLevelId = 'amateur' | 'academy' | 'professional';

/** Filtres recruteur sur le Mercato / annuaire joueurs. */
export type RecruiterPlayerLevelFilter =
  | 'all'
  | 'amateurs'
  | 'professionnels'
  | 'centres_de_formation';

export type PlayerLevelBadgeTone = 'blue' | 'green' | 'yellow';

export interface PlayerLevelBadge {
  id: PlayerLevelId;
  label: string;
  /** Libellé court UI (pill). */
  shortLabel: string;
  tone: PlayerLevelBadgeTone;
  /** Hex officiel badge. */
  colorHex: string;
}

export const PLAYER_LEVEL_BADGES: Record<PlayerLevelId, PlayerLevelBadge> = {
  amateur: {
    id: 'amateur',
    label: 'Amateur',
    shortLabel: 'Amateur',
    tone: 'blue',
    colorHex: '#2563EB',
  },
  academy: {
    id: 'academy',
    label: 'Centre de formation / Aspirant',
    shortLabel: 'Centre / Aspirant',
    tone: 'green',
    colorHex: '#16A34A',
  },
  professional: {
    id: 'professional',
    label: 'Professionnel',
    shortLabel: 'Pro',
    tone: 'yellow',
    colorHex: '#EAB308',
  },
};

export const RECRUITER_PLAYER_LEVEL_FILTERS: {
  id: RecruiterPlayerLevelFilter;
  label: string;
  matches: PlayerLevelId[] | 'all';
}[] = [
  { id: 'all', label: 'Tous', matches: 'all' },
  { id: 'amateurs', label: 'Amateurs', matches: ['amateur'] },
  { id: 'centres_de_formation', label: 'Centres de formation', matches: ['academy'] },
  { id: 'professionnels', label: 'Professionnels', matches: ['professional'] },
];
