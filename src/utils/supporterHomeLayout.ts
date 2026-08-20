/** Accueil tribune — scores live + recherche, sans grille de zones. */
export const SUPPORTER_HOME_BLOCKS = ['clubSearch', 'liveScores', 'followedUpcoming'] as const;

export type SupporterHomeBlock = (typeof SUPPORTER_HOME_BLOCKS)[number];

export function getSupporterHomeLayout(): {
  blocks: readonly SupporterHomeBlock[];
  hasZoneGrid: boolean;
  hasTribuneHero: boolean;
  hasWeeklyQuestion: boolean;
  hasReels: boolean;
  hasTournaments: boolean;
} {
  return {
    blocks: SUPPORTER_HOME_BLOCKS,
    hasZoneGrid: false,
    hasTribuneHero: false,
    hasWeeklyQuestion: false,
    hasReels: false,
    hasTournaments: false,
  };
}
