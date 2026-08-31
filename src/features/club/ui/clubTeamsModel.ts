/**
 * Helpers purs Équipes Club — meta cartes, résumé structure (testables).
 */
import type { ClubTeamRow } from '../../../utils/clubStructureView';

export type ClubTeamCardMeta = {
  title: string;
  metaPrimary: string;
  metaSecondary: string;
  hasCoach: boolean;
  coachesLabel: string;
};

export function buildClubTeamCardMeta(row: ClubTeamRow): ClubTeamCardMeta {
  const hasCoach = row.coachNames.length > 0;
  const metaPrimary = [row.category, row.genderLabel].filter(Boolean).join(' · ');
  const metaSecondary = `${row.licensedCount} licencié${row.licensedCount > 1 ? 's' : ''}`;
  return {
    title: row.name.trim() || 'Équipe',
    metaPrimary,
    metaSecondary,
    hasCoach,
    coachesLabel: hasCoach ? row.coachNames.slice(0, 2).join(', ') : 'Sans coach',
  };
}

export function summarizeClubTeamsStructure(rows: ClubTeamRow[]): {
  teamCount: number;
  licensedTotal: number;
  withoutCoach: number;
  subtitle: string;
} {
  const teamCount = rows.length;
  const licensedTotal = rows.reduce((sum, row) => sum + row.licensedCount, 0);
  const withoutCoach = rows.filter((row) => row.coachNames.length === 0).length;
  const parts = [
    `${teamCount} équipe${teamCount > 1 ? 's' : ''}`,
    `${licensedTotal} licencié${licensedTotal > 1 ? 's' : ''}`,
  ];
  if (withoutCoach > 0) {
    parts.push(
      withoutCoach > 1 ? `${withoutCoach} sans coach` : '1 sans coach',
    );
  }
  return {
    teamCount,
    licensedTotal,
    withoutCoach,
    subtitle: parts.join(' · '),
  };
}
