import type { Membership } from '../models/Membership';
import type { Team } from '../models/Team';
import type { User } from '../models/User';
import {
  aggregateTopScorers,
  buildClubTeamRows,
  buildStaffSummary,
  countActiveMembershipsByTeam,
  countPendingMemberships,
  genderScopeLabel,
} from '../utils/clubStructureView';

function team(partial: Partial<Team> & Pick<Team, 'id' | 'name'>): Team {
  return {
    club_id: 'club-1',
    gender_scope: 'unspecified',
    coach_uids: [],
    is_default: false,
    created_at: new Date(),
    updated_at: new Date(),
    ...partial,
  };
}

function membership(partial: Partial<Membership> & Pick<Membership, 'id' | 'player_uid' | 'player_name'>): Membership {
  return {
    club_id: 'club-1',
    team_id: 't1',
    status: 'active',
    requested_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    ...partial,
  };
}

function player(uid: string, name: string, goals: number): User {
  return {
    uid,
    display_name: name,
    email: `${uid}@test.com`,
    role: 'player',
    is_verified: false,
    verification_status: 'NOT_REQUIRED',
    profile: { season_stats: { goals, matches: 10, assists: 0 } },
    documents: [],
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true,
  };
}

describe('clubStructureView', () => {
  it('compte les licenciés actifs par équipe', () => {
    const rows = [
      membership({ id: 'm1', player_uid: 'p1', player_name: 'A', team_id: 't1' }),
      membership({ id: 'm2', player_uid: 'p2', player_name: 'B', team_id: 't1' }),
      membership({ id: 'm3', player_uid: 'p3', player_name: 'C', team_id: 't2' }),
      membership({ id: 'm4', player_uid: 'p4', player_name: 'D', team_id: 'unassigned', status: 'pending' }),
    ];
    expect(countActiveMembershipsByTeam(rows, 't1')).toBe(2);
    expect(countPendingMemberships(rows)).toBe(1);
  });

  it('construit les lignes équipe avec coach et genre', () => {
    const teams = [
      team({
        id: 't1',
        name: 'U15 Filles',
        category: 'U15',
        gender_scope: 'women',
        coach_uids: ['coach-1'],
      }),
    ];
    const memberships = [
      membership({ id: 'm1', player_uid: 'p1', player_name: 'A', team_id: 't1' }),
    ];
    const coachNames = new Map([['coach-1', 'Diallo']]);
    const rows = buildClubTeamRows(teams, memberships, coachNames);
    expect(rows).toHaveLength(1);
    expect(rows[0].licensedCount).toBe(1);
    expect(rows[0].coachNames).toEqual(['Diallo']);
    expect(genderScopeLabel('women')).toBe('Filles');
  });

  it('agrège le staff et les top buteurs', () => {
    const teams = [
      team({ id: 't1', name: 'Seniors', coach_uids: ['c1', 'c2'] }),
      team({ id: 't2', name: 'U17', coach_uids: ['c2'] }),
    ];
    const staff = buildStaffSummary(teams);
    expect(staff.coachCount).toBe(2);

    const scorers = aggregateTopScorers(
      [player('p1', 'Martin', 5), player('p2', 'Dupont', 12), player('p3', 'Bernard', 3)],
      2
    );
    expect(scorers.map((s) => s.name)).toEqual(['Dupont', 'Martin']);
  });
});
