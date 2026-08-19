export type PlayerThemeMode = 'default' | 'club' | 'custom';

export interface PlayerThemeCustomColors {
  accent: string;
  accentSecondary?: string;
  background?: string;
  surface?: string;
}

export interface PlayerThemePrefs {
  mode: PlayerThemeMode;
  custom?: PlayerThemeCustomColors;
}

export const DEFAULT_PLAYER_THEME_PREFS: PlayerThemePrefs = { mode: 'default' };
