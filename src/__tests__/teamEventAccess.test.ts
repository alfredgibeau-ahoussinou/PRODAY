import {
  canViewTeamEvent,
  canRespondToTeamEvent,
  canManageTeamEvent,
  assertTeamEventRsvpAccess,
} from '../utils/teamEventAccess';
import type { TeamEvent } from '../models/TeamEvent';
import type { User } from '../models/User';

const baseEvent: TeamEvent = {
  id: 'ev-1',
  title: 'Entraînement',
  event_type: 'training',
  organizer_uid: 'org-1',
  organizer_name: 'Coach',
  club_id: 'club-a',
  starts_at: new Date(),
  city: 'Lyon',
  invitee_uids: ['player-1'],
  rsvps: {},
  created_at: new Date(),
  updated_at: new Date(),
};

function player(uid: string): User {
  return {
    uid,
    role: 'player',
    display_name: 'Joueur',
    profile: {},
    city: 'Lyon',
    created_at: new Date(),
    updated_at: new Date(),
  } as User;
}

describe('teamEventAccess', () => {
  it('autorise un convoqué', () => {
    expect(canViewTeamEvent(baseEvent, player('player-1'))).toBe(true);
    expect(canRespondToTeamEvent(baseEvent, player('player-1'))).toBe(true);
  });

  it('refuse un joueur non convoqué', () => {
    expect(canViewTeamEvent(baseEvent, player('player-2'))).toBe(false);
    expect(() => assertTeamEventRsvpAccess(baseEvent, 'player-2')).toThrow(/convoqué/);
  });

  it('autorise les détections pour tout utilisateur connecté', () => {
    const detection = { ...baseEvent, event_type: 'detection' as const, invitee_uids: [] };
    expect(canViewTeamEvent(detection, player('player-2'))).toBe(true);
    expect(canRespondToTeamEvent(detection, player('player-2'))).toBe(true);
  });

  it('autorise le staff du club à gérer l’événement', () => {
    const coach = {
      ...player('coach-1'),
      role: 'coach' as const,
      profile: { club_id: 'club-a' },
    } as User;
    expect(canManageTeamEvent(baseEvent, coach)).toBe(true);
    expect(canManageTeamEvent(baseEvent, player('player-2'))).toBe(false);
  });

  it('autorise un supporter sur tournoi ou club suivi', () => {
    const supporter = { ...player('sup-1'), role: 'supporter' as const } as User;
    const tournamentEvent = { ...baseEvent, tournament_id: 't1', invitee_uids: [] };
    expect(canViewTeamEvent(tournamentEvent, supporter)).toBe(true);
    expect(
      canViewTeamEvent(baseEvent, supporter, {
        supporterFollow: { clubIds: new Set(['club-a']), tournamentIds: new Set() },
      }),
    ).toBe(true);
    expect(canViewTeamEvent(baseEvent, supporter)).toBe(false);
  });
});
