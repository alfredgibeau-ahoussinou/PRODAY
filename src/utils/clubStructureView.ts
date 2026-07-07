import type { Membership } from '../models/Membership';
import type { Team, TeamGenderScope } from '../models/Team';
import type { User } from '../models/User';

export interface ClubTeamRow {
  teamId: string;
  name: string;
  category?: string;
  genderLabel: string;
  licensedCount: number;
  coachNames: string[];
  isDefault: boolean;
}

export interface ClubStructureStaffSummary {
  coachCount: number;
  coachUids: string[];
}

export interface ClubTopScorerRow {
  uid: string;
  name: string;
  goals: number;
}

const GENDER_LABELS: Record<TeamGenderScope, string> = {
  men: 'Garçons',
  women: 'Filles',
  mixed: 'Mixte',
  unspecified: '',
};

export function genderScopeLabel(scope: TeamGenderScope): string {
  return GENDER_LABELS[scope] ?? '';
}

export function countActiveMembershipsByTeam(
  memberships: Membership[],
  teamId: string
): number {
  return memberships.filter(
    (m) => m.status === 'active' && m.team_id === teamId && m.team_id !== 'unassigned'
  ).length;
}

export function countPendingMemberships(memberships: Membership[]): number {
  return memberships.filter((m) => m.status === 'pending').length;
}

export function buildStaffSummary(teams: Team[]): ClubStructureStaffSummary {
  const coachUids = Array.from(
    new Set(teams.flatMap((team) => team.coach_uids).filter(Boolean))
  );
  return {
    coachCount: coachUids.length,
    coachUids,
  };
}

export function buildClubTeamRows(
  teams: Team[],
  memberships: Membership[],
  coachNamesByUid: Map<string, string>
): ClubTeamRow[] {
  const active = memberships.filter((m) => m.status === 'active');
  const unassignedCount = active.filter(
    (m) => !m.team_id || m.team_id === 'unassigned'
  ).length;

  const rows = teams
    .filter((team) => !team.is_default || teams.length === 1)
    .map((team) => {
      let licensedCount = countActiveMembershipsByTeam(active, team.id);
      if (licensedCount === 0 && team.is_default && unassignedCount > 0) {
        licensedCount = unassignedCount;
      }
      const coachNames = team.coach_uids
        .map((uid) => coachNamesByUid.get(uid))
        .filter((name): name is string => Boolean(name));

      return {
        teamId: team.id,
        name: team.name,
        category: team.category,
        genderLabel: genderScopeLabel(team.gender_scope),
        licensedCount,
        coachNames,
        isDefault: team.is_default,
      };
    });

  return rows.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

export function aggregateTopScorers(members: User[], limit = 3): ClubTopScorerRow[] {
  return members
    .map((member) => ({
      uid: member.uid,
      name: member.display_name,
      goals: member.profile.season_stats?.goals ?? 0,
    }))
    .filter((row) => row.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, limit);
}

export function formatTeamRowLabel(row: ClubTeamRow): string {
  const parts = [row.name];
  if (row.category) parts.push(row.category);
  if (row.genderLabel) parts.push(row.genderLabel);
  return parts.join(' · ');
}
