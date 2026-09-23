/**
 * Saison de football française — **un seul endroit la définit**.
 *
 * La saison commence le **1er août** et se termine le **31 juillet**. Ce seuil est écrit
 * ici une fois, et partout ailleurs il est dérivé.
 *
 * Pourquoi c'est structurant : « prévu vs réalisé » et « impayé » n'ont de sens que
 * rattachés à une saison. Si deux modules calculaient leur propre intervalle, une ligne
 * budgétaire et une écriture du même mois pourraient tomber dans deux saisons
 * concurrentes — et tout écart affiché deviendrait invérifiable.
 */

export const CLUB_SEASON_START_MONTH = 8;

/** Libellé de saison, forme `AAAA-AAAA` (ex. `2026-2027`). */
export type ClubSeasonLabel = string;

export function isValidClubSeasonLabel(label: string): boolean {
  if (!/^\d{4}-\d{4}$/.test(label)) return false;
  const startYear = Number(label.slice(0, 4));
  return Number(label.slice(5)) === startYear + 1;
}

/** Année de début de la saison qui contient `date`. */
export function clubSeasonStartYear(date: Date): number {
  const y = date.getFullYear();
  return date.getMonth() + 1 >= CLUB_SEASON_START_MONTH ? y : y - 1;
}

export function clubSeasonLabelForDate(date: Date): ClubSeasonLabel {
  const startYear = clubSeasonStartYear(date);
  return `${startYear}-${startYear + 1}`;
}

/** Bornes `[start, end[` de la saison qui contient `date`. */
export function clubSeasonBoundsForDate(date: Date): { start: Date; end: Date } {
  const startYear = clubSeasonStartYear(date);
  return {
    start: new Date(startYear, CLUB_SEASON_START_MONTH - 1, 1, 0, 0, 0, 0),
    end: new Date(startYear + 1, CLUB_SEASON_START_MONTH - 1, 1, 0, 0, 0, 0),
  };
}

/**
 * Bornes d'un libellé de saison. `null` si le libellé est mal formé : on refuse alors de
 * calculer plutôt que de retomber silencieusement sur la saison courante — un repli
 * silencieux attribuerait des montants à la mauvaise saison.
 */
export function clubSeasonBoundsFromLabel(
  label: ClubSeasonLabel,
): { start: Date; end: Date } | null {
  if (!isValidClubSeasonLabel(label)) return null;
  const startYear = Number(label.slice(0, 4));
  return {
    start: new Date(startYear, CLUB_SEASON_START_MONTH - 1, 1, 0, 0, 0, 0),
    end: new Date(startYear + 1, CLUB_SEASON_START_MONTH - 1, 1, 0, 0, 0, 0),
  };
}

export function isDateInClubSeason(date: Date, label: ClubSeasonLabel): boolean {
  const bounds = clubSeasonBoundsFromLabel(label);
  if (!bounds) return false;
  const t = date.getTime();
  return t >= bounds.start.getTime() && t < bounds.end.getTime();
}

export function formatClubSeasonLabel(label: ClubSeasonLabel): string {
  return isValidClubSeasonLabel(label) ? `Saison ${label}` : 'Saison non renseignée';
}
