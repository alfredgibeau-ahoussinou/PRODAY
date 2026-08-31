import { matchPlayersToRosterNeed } from '../utils/clubRosterMatching';
import type { ClubRosterNeed } from '../models/ClubRosterBoard';
import type { User } from '../models/User';

function makePlayer(
  uid: string,
  opts: {
    name: string;
    position?: string;
    category?: string;
    clubId?: string;
    foot?: string;
    level?: string;
  },
): User {
  return {
    uid,
    display_name: opts.name,
    role: 'player',
    email: `${uid}@test.proday`,
    created_at: new Date(),
    profile: {
      club_id: opts.clubId ?? 'club-1',
      position: opts.position,
      category: opts.category,
      strong_foot: opts.foot,
      level: opts.level,
    },
  } as User;
}

describe('clubRosterMatching', () => {
  const need: ClubRosterNeed = {
    id: 'need-1',
    club_id: 'club-1',
    team_id: 'team-u15a',
    team_label: 'U15 A',
    category: 'U15',
    position: 'defender',
    urgency: 'medium',
    players_needed: 1,
    scope: 'internal',
    status: 'open',
    created_by_uid: 'coach-1',
    created_by_name: 'Coach',
    created_at: new Date(),
  };

  it('ranks compatible club defenders above mismatched profiles', () => {
    const players = [
      makePlayer('a', { name: 'Alex', position: 'Défenseur central', category: 'U14' }),
      makePlayer('b', { name: 'Ben', position: 'Gardien', category: 'U15' }),
      makePlayer('c', { name: 'Chris', position: 'Milieu', category: 'Seniors', clubId: 'other' }),
    ];
    const matches = matchPlayersToRosterNeed(need, players, {
      'team-u15a': 'U15 A',
    });
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].player_uid).toBe('a');
    expect(matches[0].score).toBeGreaterThanOrEqual(70);
    expect(matches[0].reasons.some((r) => r.includes('Poste'))).toBe(true);
    expect(matches.every((m) => m.player_uid !== 'c')).toBe(true);
  });

  it('excludes players already on the requesting team', () => {
    const onTeam = makePlayer('same', {
      name: 'Sam',
      position: 'Défenseur',
      category: 'U15',
    });
    (onTeam.profile as { team_id?: string }).team_id = 'team-u15a';
    const matches = matchPlayersToRosterNeed(need, [onTeam], {
      'team-u15a': 'U15 A',
    });
    expect(matches).toHaveLength(0);
  });
});
