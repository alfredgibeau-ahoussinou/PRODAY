import {
  buildClubMatchCardModel,
  resolveClubMatchHero,
  resolveMatchHubActions,
  sortClubMatches,
  summarizeMatchPresence,
} from '../features/club/ui/clubMatchesModel';
import type { TeamEvent } from '../models/TeamEvent';

function matchEvent(partial: Partial<TeamEvent> & Pick<TeamEvent, 'id' | 'starts_at'>): TeamEvent {
  return {
    title: 'Match test',
    description: undefined,
    event_type: 'competition',
    organizer_uid: 'org',
    organizer_name: 'Org',
    club_id: 'c1',
    club_name: 'FC ProDay',
    invitee_uids: [],
    rsvps: {},
    city: 'Paris',
    created_at: new Date(),
    updated_at: new Date(),
    ...partial,
  } as TeamEvent;
}

describe('clubMatchesModel', () => {
  it('trie les matchs par horaire', () => {
    const later = matchEvent({
      id: 'b',
      starts_at: new Date('2030-06-02T18:00:00'),
      event_type: 'friendly',
    });
    const sooner = matchEvent({
      id: 'a',
      starts_at: new Date('2030-06-01T15:00:00'),
      event_type: 'competition',
    });
    expect(sortClubMatches([later, sooner]).map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('priorise un match live pour le hero', () => {
    const upcoming = matchEvent({
      id: 'up',
      starts_at: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });
    const live = matchEvent({
      id: 'live',
      starts_at: new Date(Date.now() - 20 * 60 * 1000),
      live_state: {
        status: 'live',
        home_score: 1,
        away_score: 0,
        home_label: 'FC ProDay',
        opponent_name: 'Rivaux',
      },
    });
    const hero = resolveClubMatchHero([upcoming, live]);
    expect(hero?.id).toBe('live');
  });

  it('résume les convocations sans jargon technique', () => {
    const empty = summarizeMatchPresence(
      matchEvent({ id: 'e', starts_at: new Date(), invitee_uids: [], rsvps: {} }),
    );
    expect(empty.label).toBe('Pas encore de convocations');

    const pending = summarizeMatchPresence(
      matchEvent({
        id: 'p',
        starts_at: new Date(),
        invitee_uids: ['u1', 'u2', 'u3'],
        rsvps: { u1: 'yes', u2: 'pending' },
      }),
    );
    expect(pending.pending).toBe(2);
    expect(pending.label).toContain('en attente');
  });

  it('expose score réel seulement si live / terminé', () => {
    const scheduled = buildClubMatchCardModel(
      matchEvent({
        id: 's',
        starts_at: new Date(Date.now() + 86400000),
        title: 'U15 vs AS Rivale',
        team_id: 't1',
      }),
      [{ teamId: 't1', name: 'U15', category: 'U15', genderLabel: 'Garçons', licensedCount: 16, coachNames: [], isDefault: false }],
    );
    expect(scheduled.showScore).toBe(false);
    expect(scheduled.awayLabel).toBe('AS Rivale');
    expect(scheduled.teamLabel).toBe('U15');

    const finished = buildClubMatchCardModel(
      matchEvent({
        id: 'f',
        starts_at: new Date(Date.now() - 3 * 60 * 60 * 1000),
        live_state: {
          status: 'finished',
          home_score: 2,
          away_score: 1,
          home_label: 'FC ProDay',
          opponent_name: 'Rivaux',
        },
      }),
      [],
    );
    expect(finished.showScore).toBe(true);
    expect(finished.homeScore).toBe(2);
    expect(finished.awayScore).toBe(1);
  });

  it('propose des CTAs hub existants (détail, convocs, compo, live)', () => {
    const model = buildClubMatchCardModel(
      matchEvent({
        id: 'm',
        starts_at: new Date(),
        invitee_uids: ['a', 'b'],
        rsvps: { a: 'pending' },
        live_state: {
          status: 'live',
          home_score: 0,
          away_score: 0,
          home_label: 'Nous',
          opponent_name: 'Eux',
        },
      }),
      [],
    );
    const actions = resolveMatchHubActions(model);
    expect(actions.map((a) => a.id)).toEqual(
      expect.arrayContaining(['apercu', 'effectif', 'composition', 'live']),
    );
  });
});
