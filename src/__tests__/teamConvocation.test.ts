import {
  countActivePlayersForTeam,
  resolveConvocationInviteeUids,
  resolveEventTeamId,
  resolveInviteesForTeams,
} from '../utils/teamConvocation';

describe('teamConvocation', () => {
  const members = [
    { uid: 'p1', display_name: 'Alice', profile: { category: 'U15' } },
    { uid: 'p2', display_name: 'Bob', profile: { category: 'U17' } },
    { uid: 'p3', display_name: 'Chloé', profile: { category: 'U15' } },
  ] as const;

  const memberships = [
    { status: 'active', team_id: 'team-a', player_uid: 'p1', club_id: 'club-1' },
    { status: 'active', team_id: 'team-a', player_uid: 'p3', club_id: 'club-1' },
    { status: 'active', team_id: 'team-b', player_uid: 'p2', club_id: 'club-1' },
    { status: 'pending', team_id: 'team-a', player_uid: 'p2', club_id: 'club-1' },
  ];

  it('resolveInviteesForTeams — union sans doublons', () => {
    const invitees = resolveInviteesForTeams([...members], memberships, ['team-a', 'team-b']);
    expect(invitees.map((m) => m.uid).sort()).toEqual(['p1', 'p2', 'p3']);
  });

  it('resolveInviteesForTeams — ignore les memberships non actifs', () => {
    const invitees = resolveInviteesForTeams([...members], memberships, ['team-a']);
    expect(invitees.map((m) => m.uid)).toEqual(['p1', 'p3']);
  });

  it('resolveInviteesForTeams — liste vide si aucune équipe', () => {
    expect(resolveInviteesForTeams([...members], memberships, [])).toEqual([]);
  });

  it('countActivePlayersForTeam — compte les actifs uniquement', () => {
    expect(countActivePlayersForTeam(memberships, 'team-a')).toBe(2);
    expect(countActivePlayersForTeam(memberships, 'team-b')).toBe(1);
  });

  it('resolveEventTeamId — une équipe vs plusieurs', () => {
    expect(resolveEventTeamId(['team-a'])).toBe('team-a');
    expect(resolveEventTeamId(['team-a', 'team-b'])).toBeUndefined();
    expect(resolveEventTeamId([])).toBeUndefined();
  });

  it('resolveConvocationInviteeUids — intersection catégories + exclusion organisateur', () => {
    const uids = resolveConvocationInviteeUids(
      [...members] as never,
      memberships as never,
      ['team-a', 'team-b'],
      ['U15'],
      'coach-1',
    );
    expect(uids.sort()).toEqual(['p1', 'p3']);
  });
});
