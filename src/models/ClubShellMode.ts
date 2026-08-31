/**
 * Mode de shell pour le compte Club — Pôle Club vs Pôle Président.
 * Même product_line `pro_club`, même rôle `club`, navigation croisée préservée.
 */
export type ClubShellMode = 'club' | 'president';

export const CLUB_SHELL_MODE_STORAGE_KEY = 'proday_club_shell_mode';

export function normalizeClubShellMode(value: string | null | undefined): ClubShellMode {
  return value === 'president' ? 'president' : 'club';
}

export function clubShellModeFromCarouselPole(
  pole: string | null | undefined,
): ClubShellMode | null {
  if (pole === 'president') return 'president';
  if (pole === 'pro_club' || pole === 'evenements') return 'club';
  return null;
}
