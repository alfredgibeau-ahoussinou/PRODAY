/**
 * Contexte joueur pour filtres Mercato (poste / parcours) — pas un badge de prestige.
 * IDs stables Firestore. UI : jamais « Pro », « Aspirant », « Elite ».
 */

export type PlayerLevelId = 'amateur' | 'academy' | 'professional';

/** Filtres recruteur / club sur l’annuaire joueurs. */
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
  /** Hex officiel — palette ProDay bleu. */
  colorHex: string;
}

/**
 * Libellés descriptifs (parcours), pas des titres honorifiques.
 */
export const PLAYER_LEVEL_BADGES: Record<PlayerLevelId, PlayerLevelBadge> = {
  amateur: {
    id: 'amateur',
    label: 'Football amateur',
    shortLabel: 'Amateur',
    tone: 'blue',
    colorHex: '#0054F0',
  },
  academy: {
    id: 'academy',
    label: 'Formation / Jeunes',
    shortLabel: 'Formation',
    tone: 'blue',
    colorHex: '#1A68FF',
  },
  professional: {
    id: 'professional',
    label: 'Semi-pro / Haut niveau',
    shortLabel: 'Haut niveau',
    tone: 'blue',
    colorHex: '#001F6B',
  },
};

export const RECRUITER_PLAYER_LEVEL_FILTERS: {
  id: RecruiterPlayerLevelFilter;
  label: string;
  matches: PlayerLevelId[] | 'all';
}[] = [
  { id: 'all', label: 'Tous', matches: 'all' },
  { id: 'amateurs', label: 'Amateurs', matches: ['amateur'] },
  { id: 'centres_de_formation', label: 'Formation / Jeunes', matches: ['academy'] },
  { id: 'professionnels', label: 'Haut niveau', matches: ['professional'] },
];
