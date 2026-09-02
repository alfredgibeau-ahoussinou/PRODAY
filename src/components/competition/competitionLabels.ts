import type { CompetitionFixtureStatus, CompetitionSeasonStatus } from '../../models/Competition';

export function competitionFixtureStatusLabel(status: CompetitionFixtureStatus): string {
  switch (status) {
    case 'validated':
      return 'Validé';
    case 'awaiting_validation':
      return 'À valider';
    case 'contested':
      return 'Contesté';
    case 'live':
      return 'Direct';
    case 'void':
      return 'Annulé';
    case 'scheduled':
    default:
      return 'Programmé';
  }
}

export function competitionSeasonStatusLabel(status: CompetitionSeasonStatus): string {
  switch (status) {
    case 'active':
      return 'En cours';
    case 'closed':
      return 'Clôturée';
    case 'draft':
    default:
      return 'Brouillon';
  }
}

export function competitionFixtureScoreLine(f: {
  home_score: number | null;
  away_score: number | null;
}): string {
  if (f.home_score != null && f.away_score != null) {
    return `${f.home_score} à ${f.away_score}`;
  }
  return 'vs';
}
