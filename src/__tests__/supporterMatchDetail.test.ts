import {
  mapApiFootballEvent,
  mapApiFootballLineup,
  parseProdayEventId,
  parseWorldFixtureApiId,
  liveStateFromMatchItem,
} from '../utils/supporterMatchDetail';
import {
  buildWorldFollowIndex,
  fixtureMatchesWorldFollows,
  worldTeamFollowIdFromName,
} from '../utils/supporterWorldFollows';
import type { Follow } from '../models/Follow';

describe('supporterMatchDetail mappers', () => {
  it('mappe une composition API-Football 4-4-2', () => {
    const mapped = mapApiFootballLineup({
      team: { id: 85, name: 'Paris SG' },
      formation: '4-4-2',
      startXI: [
        { player: { id: 1, name: 'Donnarumma', pos: 'G' } },
        { player: { id: 2, name: 'Hakimi', pos: 'D' } },
      ],
      substitutes: [{ player: { id: 9, name: 'Barcola', pos: 'F' } }],
    });
    expect(mapped?.formation).toBe('4-4-2');
    expect(mapped?.lineup.slots.filter((s) => s.role === 'starter')).toHaveLength(2);
    expect(mapped?.lineup.slots.some((s) => s.display_name === 'Barcola')).toBe(true);
  });

  it('renvoie null si la composition n’est pas publiée', () => {
    expect(mapApiFootballLineup({ team: { name: 'PSG' }, startXI: [], substitutes: [] })).toBeNull();
  });

  it('mappe buts et cartons', () => {
    const goal = mapApiFootballEvent(
      { type: 'Goal', player: { id: 7, name: 'Mbappé' }, time: { elapsed: 12 } },
      0,
    );
    const yellow = mapApiFootballEvent(
      { type: 'Card', detail: 'Yellow Card', player: { name: 'X' }, time: { elapsed: 40 } },
      1,
    );
    expect(goal?.type).toBe('goal');
    expect(yellow?.type).toBe('yellow_card');
  });

  it('parse les ids de détail', () => {
    expect(parseWorldFixtureApiId('world-fixture-api_123')).toBe(123);
    expect(parseWorldFixtureApiId('world-fixture-ligue1_psg_om')).toBeNull();
    expect(parseProdayEventId('proday-event-abc')).toBe('abc');
  });

  it('construit un scoreboard depuis un item', () => {
    const state = liveStateFromMatchItem({
      id: 'x',
      source: 'world',
      status: 'live',
      genderScope: 'men',
      homeLabel: 'A',
      awayLabel: 'B',
      scoreHome: 2,
      scoreAway: 1,
      minute: 63,
      startsAt: new Date(),
    });
    expect(state.status).toBe('live');
    expect(state.home_score).toBe(2);
  });
});

describe('supporterWorldFollows', () => {
  it('relie une fixture monde à un club suivi par nom', () => {
    const follows: Follow[] = [
      {
        id: '1',
        follower_uid: 'u',
        target_type: 'club',
        target_id: worldTeamFollowIdFromName('Paris SG'),
        target_label: 'Paris SG',
        created_at: new Date(),
      },
    ];
    const index = buildWorldFollowIndex(follows);
    expect(
      fixtureMatchesWorldFollows(
        { home_team: 'Paris SG', away_team: 'Marseille' },
        index,
      ),
    ).toBe(true);
    expect(
      fixtureMatchesWorldFollows({ home_team: 'Lyon', away_team: 'Nice' }, index),
    ).toBe(false);
  });

  it('relie Paris SG à un suivi wt:id:85 via alias catalogue', () => {
    const follows: Follow[] = [
      {
        id: '1',
        follower_uid: 'u',
        target_type: 'club',
        target_id: 'wt:id:85',
        target_label: 'Paris Saint-Germain',
        created_at: new Date(),
      },
    ];
    const index = buildWorldFollowIndex(follows);
    expect(
      fixtureMatchesWorldFollows(
        { home_team: 'Paris SG', away_team: 'Marseille' },
        index,
      ),
    ).toBe(true);
  });
});
