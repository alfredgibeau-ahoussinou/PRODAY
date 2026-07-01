import type { ExternalFixture } from '../services/externalScores.service';
import type { Follow } from '../models/Follow';
import type { TeamEvent } from '../models/TeamEvent';
import type { Tournament } from '../models/Tournament';
import {
  buildFollowContext,
  externalFixtureToMatchItem,
  filterMatchItems,
  filterTournaments,
  filterTournamentsBySearch,
  inferGenderFromCategories,
  inferGenderFromExternalFixture,
  teamEventToMatchItem,
} from '../utils/supporterMatchFilters';

function follow(
  target_type: Follow['target_type'],
  target_id: string
): Follow {
  return {
    id: `${target_type}-${target_id}`,
    follower_uid: 'u1',
    target_type,
    target_id,
    created_at: new Date(),
  };
}

function event(partial: Partial<TeamEvent> & Pick<TeamEvent, 'id' | 'starts_at'>): TeamEvent {
  return {
    title: 'Match',
    event_type: 'friendly',
    organizer_uid: 'c1',
    organizer_name: 'Coach',
    city: 'Paris',
    invitee_uids: [],
    rsvps: {},
    created_at: new Date(),
    updated_at: new Date(),
    ...partial,
  };
}

describe('supporterMatchFilters', () => {
  it('infère le genre depuis les catégories', () => {
    expect(inferGenderFromCategories(['U15 Filles'])).toBe('women');
    expect(inferGenderFromCategories(['U13 Garçons'])).toBe('men');
    expect(inferGenderFromCategories(['Mixte open'])).toBe('mixed');
  });

  it('infère le genre des fixtures monde', () => {
    const ligue1: ExternalFixture = {
      id: 'l1',
      competition: 'ligue1',
      competition_label: 'Ligue 1',
      home_team: 'PSG',
      away_team: 'OM',
      starts_at: new Date(),
      status: 'live',
    };
    const d1f: ExternalFixture = {
      id: 'd1',
      competition: 'd1f',
      competition_label: 'D1 Arkema',
      home_team: 'OL',
      away_team: 'PFC',
      starts_at: new Date(),
      status: 'scheduled',
    };
    expect(inferGenderFromExternalFixture(ligue1)).toBe('men');
    expect(inferGenderFromExternalFixture(d1f)).toBe('women');
  });

  it('filtre par genre, source et portée', () => {
    const ctx = buildFollowContext([
      follow('club', 'club-a'),
      follow('tournament', 't1'),
    ]);
    const items = [
      teamEventToMatchItem(
        event({
          id: 'e1',
          starts_at: new Date(),
          club_id: 'club-a',
          categories: ['U15 Filles'],
        })
      ),
      externalFixtureToMatchItem({
        id: 'w1',
        competition: 'ligue1',
        competition_label: 'Ligue 1',
        home_team: 'PSG',
        away_team: 'OM',
        starts_at: new Date(),
        status: 'live',
      }),
    ];

    const womenOnly = filterMatchItems(items, { gender: 'women', source: 'all', scope: 'all' }, ctx);
    expect(womenOnly).toHaveLength(1);
    expect(womenOnly[0].source).toBe('proday');

    const worldOnly = filterMatchItems(items, { gender: 'all', source: 'world', scope: 'all' }, ctx);
    expect(worldOnly).toHaveLength(1);
    expect(worldOnly[0].source).toBe('world');

    const followsOnly = filterMatchItems(items, { gender: 'all', source: 'all', scope: 'follows' }, ctx);
    expect(followsOnly).toHaveLength(1);
    expect(followsOnly[0].clubId).toBe('club-a');
  });

  it('extrait les buteurs depuis live_actions', () => {
    const item = teamEventToMatchItem(
      event({
        id: 'e2',
        starts_at: new Date(),
        live_actions: [
          {
            id: 'g1',
            type: 'goal',
            player_uid: 'p1',
            player_name: 'Dupont',
            minute: 12,
            created_at: new Date(),
          },
        ],
        live_state: { status: 'live', home_score: 1, away_score: 0, minute: 15 },
      })
    );
    expect(item.scorers).toEqual(["Dupont 12'"]);
  });

  it('filtre les tournois par ville et date', () => {
    const now = new Date('2026-07-01T12:00:00.000Z');
    jest.useFakeTimers();
    jest.setSystemTime(now);

    const tournaments: Tournament[] = [
      {
        id: 't1',
        title: 'Tournoi Paris',
        city: 'Paris',
        starts_at: new Date('2026-07-03T10:00:00.000Z'),
        max_teams: 8,
        entry_fee_cents: 0,
        categories: ['U15 Filles'],
        organizer_uid: 'o1',
        organizer_name: 'Org',
        status: 'open',
        registrations: [],
        pools: [],
        fixtures: [],
        standings: {},
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 't2',
        title: 'Tournoi Lyon',
        city: 'Lyon',
        starts_at: new Date('2026-08-01T10:00:00.000Z'),
        max_teams: 8,
        entry_fee_cents: 0,
        categories: ['U13'],
        organizer_uid: 'o1',
        organizer_name: 'Org',
        status: 'open',
        registrations: [],
        pools: [],
        fixtures: [],
        standings: {},
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const ctx = buildFollowContext([]);
    const parisWeek = filterTournamentsBySearch(
      filterTournaments(tournaments, { gender: 'all', source: 'all', scope: 'all' }, ctx),
      'paris',
      'week'
    );
    expect(parisWeek).toHaveLength(1);
    expect(parisWeek[0].id).toBe('t1');

    jest.useRealTimers();
  });
});
