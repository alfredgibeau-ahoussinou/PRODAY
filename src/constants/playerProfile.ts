export const PLAYER_POSITIONS = [
  'Attaquant',
  'Milieu',
  'Défenseur',
  'Gardien',
] as const;

export const PLAYER_CATEGORIES = [
  'U13',
  'U15',
  'U17',
  'U19',
  'Seniors',
  'Vétérans',
] as const;

export const PLAYER_LEVELS = [
  'Loisir',
  'Départemental',
  'R3',
  'R2',
  'R1',
  'N3',
  'N2',
  'N1',
] as const;

export type PlayerPosition = (typeof PLAYER_POSITIONS)[number];
export type PlayerCategory = (typeof PLAYER_CATEGORIES)[number];
export type PlayerLevel = (typeof PLAYER_LEVELS)[number];
