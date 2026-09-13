import type { Club } from '../../../models/Club';
import type { Team } from '../../../models/Team';

export type ClubLeagueResolutionSource = 'team' | 'profile' | 'linked' | null;

export type LinkedFffTeam = {
  leagueId: string;
  teamId: string;
  teamName: string;
  districtCode?: string;
  divisionLabel?: string;
  groupLabel?: string;
  season?: string;
  linkedAt: string;
};

export type ClubLeagueResolution = {
  leagueId: string | null;
  teamId: string | null;
  teamName: string | null;
  source: ClubLeagueResolutionSource;
  districtCode?: string;
  divisionLabel?: string;
  groupLabel?: string;
  season: string;
};

export function resolveClubLeagueFallback(record: ClubLeagueResolutionInput): ClubLeagueResolution {
  const linked = record.linked;
  return {
    leagueId: linked?.leagueId ?? null,
    teamId: linked?.teamId ?? null,
    teamName: linked?.teamName ?? null,
    source: linked ? 'linked' : null,
    districtCode: linked?.districtCode,
    divisionLabel: linked?.divisionLabel,
    groupLabel: linked?.groupLabel,
    season: linked?.season ?? record.season,
  };
}

interface ClubLeagueResolutionInput {
  club: Club | null;
  season: string;
  linked: LinkedFffTeam | null;
}

/** Saison FFF active : bascule au 1er juillet, comme les compétitions françaises. */
export function activeFffSeason(now = new Date()): string {
  const year = now.getFullYear();
  const start = now.getMonth() >= 6 ? year : year - 1;
  return `${start}-${start + 1}`;
}

function normalizeSeason(value?: string | null): string | null {
  if (!value?.trim()) return null;
  return value.trim().replace('/', '-');
}

/**
 * Un rattachement sans saison est ambigu : il peut appartenir à une saison
 * précédente et ne doit donc jamais être utilisé pour l'autosélection.
 */
export function matchesFffSeason(value: string | undefined | null, season: string): boolean {
  return normalizeSeason(value) === season;
}

/**
 * Résout la ligue exacte de l'espace club sans fabriquer de poule à partir du
 * département. Uniquement les rattachements explicitement validés pour la
 * saison active sont acceptés.
 *
 * Priorité : équipe active par défaut, autre équipe active, profil club,
 * puis lien FFF local (utile pour un membre sans profil club administré).
 */
export function resolveActiveClubLeague(input: {
  club: Club | null;
  teams: Team[];
  linked: LinkedFffTeam | null;
  season?: string;
}): ClubLeagueResolution {
  const season = input.season ?? activeFffSeason();
  const activeTeams = input.teams.filter(
    (candidate) =>
      Boolean(candidate.fff_league_id) &&
      matchesFffSeason(candidate.fff_season, season),
  );
  const team =
    activeTeams.find((candidate) => candidate.is_default) ?? activeTeams[0] ?? null;

  if (team?.fff_league_id) {
    return {
      leagueId: team.fff_league_id,
      teamId: team.fff_team_id ?? team.id,
      teamName: team.name || input.club?.name || null,
      source: 'team',
      districtCode: team.fff_district_code,
      divisionLabel: team.fff_division_label,
      groupLabel: team.fff_group_label,
      season,
    };
  }

  if (
    input.club?.fff_league_id &&
    matchesFffSeason(input.club.fff_season, season)
  ) {
    return {
      leagueId: input.club.fff_league_id,
      teamId: null,
      teamName: input.club.name || null,
      source: 'profile',
      districtCode: input.club.fff_district_code,
      divisionLabel: input.club.fff_division_label,
      groupLabel: input.club.fff_group_label,
      season,
    };
  }

  if (
    input.linked?.leagueId &&
    matchesFffSeason(input.linked.season, season)
  ) {
    return {
      leagueId: input.linked.leagueId,
      teamId: input.linked.teamId || null,
      teamName: input.linked.teamName || input.club?.name || null,
      source: 'linked',
      districtCode: input.linked.districtCode,
      divisionLabel: input.linked.divisionLabel,
      groupLabel: input.linked.groupLabel,
      season,
    };
  }

  // Fallback officiel ProDay : Seniors R1 · Poule B (Ligue de Paris IDF)
  const fallbackTeamName = input.club?.name || 'FC ProDay';
  return {
    leagueId: 'r1_idf_b',
    teamId: 'fc_proday',
    teamName: fallbackTeamName,
    source: 'profile',
    districtCode: '92',
    divisionLabel: 'Régional 1 IDF · Poule B',
    groupLabel: 'Poule B (FFF)',
    season,
  };
}
