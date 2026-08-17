export const PLAYER_POSITIONS = [
  'Attaquant',
  'Milieu',
  'Défenseur',
  'Gardien',
] as const;

export {
  FOOTBALL_AGE_CATEGORIES as PLAYER_CATEGORIES,
  FOOTBALL_COMPETITION_LEVELS as PLAYER_LEVELS,
  type FootballAgeCategory as PlayerCategory,
  type FootballCompetitionLevel as PlayerLevel,
} from './footballCategories';

export type PlayerPosition = (typeof PLAYER_POSITIONS)[number];
