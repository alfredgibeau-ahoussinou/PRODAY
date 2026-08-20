import type { Follow } from '../models/Follow';
import type { TeamEvent } from '../models/TeamEvent';
import type { Tournament } from '../models/Tournament';
import { fetchSupporterMatchHub, groupUpcomingByDateThenCompetition, DEFAULT_SUPPORTER_MATCHS_CHAPTER } from '../services/supporterMatchHub.service';
import { externalScoresService, resetExternalScoresProviderCache } from '../services/externalScores.service';
import { teamEventsService } from '../services/teamEvents.service';
import type { SupporterMatchFilters } from '../services/supporterPreferences.service';

jest.mock('../services/teamEvents.service', () => ({
  teamEventsService: {
    listUpcoming: jest.fn(),
  },
}));

const ALL_FILTERS: SupporterMatchFilters = {
  gender: 'all',
  source: 'all',
  scope: 'all',
  competition: 'all',
};

function event(partial: Partial<TeamEvent> & Pick<TeamEvent, 'id' | 'starts_at'>): TeamEvent {
  return {
    title: 'Match ProDay',
    event_type: 'friendly',
    organizer_uid: 'c1',
    invitee_uids: [],
    rsvps: {},
    created_at: new Date(),
    updated_at: new Date(),
    ...partial,
  } as TeamEvent;
}

describe('supporterMatchHub', () => {
  const previousFlag = process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK = '1';
    resetExternalScoresProviderCache();
    jest.clearAllMocks();
  });

  afterAll(() => {
    if (previousFlag == null) delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;
    else process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK = previousFlag;
    resetExternalScoresProviderCache();
  });

  it('fusionne live monde et sections proday/world', async () => {
    const now = Date.now();
    (teamEventsService.listUpcoming as jest.Mock).mockResolvedValue([
      event({
        id: 'proday-live',
        starts_at: new Date(now - 20 * 60 * 1000),
        club_id: 'club-a',
        club_name: 'Club A',
        live_state: { status: 'live', home_score: 1, away_score: 0, minute: 20 },
      }),
      event({
        id: 'proday-future',
        starts_at: new Date(now + 2 * 24 * 60 * 60 * 1000),
        club_id: 'club-b',
        club_name: 'Club B',
      }),
    ]);

    const result = await fetchSupporterMatchHub({
      calendarEvents: [],
      tournaments: [] as Tournament[],
      follows: [] as Follow[],
      filters: ALL_FILTERS,
    });

    expect(result.liveCount).toBeGreaterThan(0);
    expect(result.sections.live.some((item) => item.source === 'world')).toBe(true);
    expect(result.sections.proday.some((item) => item.source === 'proday')).toBe(true);
    expect(result.sections.world.length).toBeGreaterThan(0);
    expect(result.sections.upcoming.length).toBeGreaterThan(0);
    expect(result.sections.upcoming.every((item) => item.source === 'world')).toBe(true);
    expect(result.heroKickoffs.length).toBeGreaterThan(0);
    expect(result.heroKickoffs.every((item) => item.source === 'world')).toBe(true);
    expect(DEFAULT_SUPPORTER_MATCHS_CHAPTER).toBe('upcoming');
    expect(result.providerState.source).toBe('mock');
  });

  it('filtre les matchs suivis', async () => {
    const now = Date.now();
    (teamEventsService.listUpcoming as jest.Mock).mockResolvedValue([
      event({
        id: 'followed',
        starts_at: new Date(now + 60 * 60 * 1000),
        club_id: 'club-x',
        club_name: 'Club X',
      }),
      event({
        id: 'other',
        starts_at: new Date(now + 2 * 60 * 60 * 1000),
        club_id: 'club-y',
        club_name: 'Club Y',
      }),
    ]);

    const follows: Follow[] = [
      {
        id: 'f1',
        follower_uid: 'u1',
        target_type: 'club',
        target_id: 'club-x',
        created_at: new Date(),
      },
    ];

    const result = await fetchSupporterMatchHub({
      calendarEvents: [],
      tournaments: [],
      follows,
      filters: ALL_FILTERS,
    });

    expect(result.sections.follows).toHaveLength(1);
    expect(result.sections.follows[0].clubId).toBe('club-x');
    expect(result.sections.upcoming.some((item) => item.clubId === 'club-x')).toBe(true);
    expect(result.sections.upcoming.some((item) => item.clubId === 'club-y')).toBe(false);
  });

  it('filtre À venir monde via un club suivi (nom)', async () => {
    (teamEventsService.listUpcoming as jest.Mock).mockResolvedValue([]);
    const follows: Follow[] = [
      {
        id: 'f-psg',
        follower_uid: 'u1',
        target_type: 'club',
        target_id: 'wt:name:paris sg',
        target_label: 'Paris SG',
        created_at: new Date(),
      },
    ];
    const result = await fetchSupporterMatchHub({
      calendarEvents: [],
      tournaments: [],
      follows,
      filters: ALL_FILTERS,
    });
    expect(result.sections.upcoming.length).toBeGreaterThan(0);
    expect(
      result.sections.upcoming.every(
        (item) =>
          item.homeLabel.toLowerCase().includes('paris') ||
          item.awayLabel.toLowerCase().includes('paris'),
      ),
    ).toBe(true);
  });

  it('affiche À venir PSG via wt:id:85 (fetch par équipe)', async () => {
    (teamEventsService.listUpcoming as jest.Mock).mockResolvedValue([]);
    const follows: Follow[] = [
      {
        id: 'f-psg-id',
        follower_uid: 'u1',
        target_type: 'club',
        target_id: 'wt:id:85',
        target_label: 'Paris Saint-Germain',
        created_at: new Date(),
      },
    ];
    const result = await fetchSupporterMatchHub({
      calendarEvents: [],
      tournaments: [],
      follows,
      filters: ALL_FILTERS,
    });
    expect(result.sections.upcoming.length).toBeGreaterThan(0);
    expect(result.heroKickoffs.length).toBeGreaterThan(0);
    expect(
      result.sections.upcoming.some(
        (item) =>
          item.homeLabel.toLowerCase().includes('paris') ||
          item.awayLabel.toLowerCase().includes('paris'),
      ),
    ).toBe(true);
  });

  it('matche Paris Saint-Germain suivi avec fixture Paris SG (alias)', async () => {
    (teamEventsService.listUpcoming as jest.Mock).mockResolvedValue([]);
    const follows: Follow[] = [
      {
        id: 'f-psg-label',
        follower_uid: 'u1',
        target_type: 'club',
        target_id: 'wt:id:85',
        target_label: 'Paris Saint-Germain',
        created_at: new Date(),
      },
    ];
    const result = await fetchSupporterMatchHub({
      calendarEvents: [],
      tournaments: [],
      follows,
      filters: ALL_FILTERS,
    });
    expect(result.sections.upcoming.some((item) => item.homeLabel === 'Paris SG')).toBe(true);
  });

  it('garde les lives même si le filtre compétition / source est restrictif', async () => {
    (teamEventsService.listUpcoming as jest.Mock).mockResolvedValue([]);
    const result = await fetchSupporterMatchHub({
      calendarEvents: [],
      tournaments: [],
      follows: [],
      filters: { ...ALL_FILTERS, source: 'proday', competition: 'pl', scope: 'follows' },
    });
    expect(result.liveCount).toBeGreaterThan(0);
    expect(result.sections.live.some((item) => item.source === 'world')).toBe(true);
  });

  it('respecte le filtre compétition monde', async () => {
    (teamEventsService.listUpcoming as jest.Mock).mockResolvedValue([]);

    const live = await externalScoresService.listLiveFixtures();
    expect(live.some((f) => f.competition === 'pl')).toBe(true);

    const result = await fetchSupporterMatchHub({
      calendarEvents: [],
      tournaments: [],
      follows: [],
      filters: { ...ALL_FILTERS, competition: 'pl' },
    });

    const worldCompetitions = result.sections.world.map((item) => item.competitionSlug);
    expect(worldCompetitions.every((slug) => slug === 'pl' || slug == null)).toBe(true);
  });

  it('regroupe À venir par date puis compétition', () => {
    const now = new Date(2026, 6, 1, 12, 0, 0);
    const items = [
      {
        id: 'a',
        source: 'world' as const,
        status: 'upcoming' as const,
        genderScope: 'men' as const,
        homeLabel: 'A',
        awayLabel: 'B',
        startsAt: new Date(2026, 6, 1, 19, 0, 0),
        competitionLabel: 'Ligue 1',
      },
      {
        id: 'b',
        source: 'world' as const,
        status: 'upcoming' as const,
        genderScope: 'men' as const,
        homeLabel: 'C',
        awayLabel: 'D',
        startsAt: new Date(2026, 6, 1, 21, 0, 0),
        competitionLabel: 'Premier League',
      },
      {
        id: 'c',
        source: 'proday' as const,
        status: 'upcoming' as const,
        genderScope: 'unspecified' as const,
        homeLabel: 'Club',
        awayLabel: 'Adversaire',
        startsAt: new Date(2026, 6, 2, 18, 0, 0),
        competitionLabel: 'ProDay',
      },
      {
        id: 'd',
        source: 'world' as const,
        status: 'upcoming' as const,
        genderScope: 'men' as const,
        homeLabel: 'E',
        awayLabel: 'F',
        startsAt: new Date(2026, 6, 4, 16, 0, 0),
        competitionLabel: 'Ligue 1',
      },
    ];

    const groups = groupUpcomingByDateThenCompetition(items, now);
    expect(groups.map((g) => g.kind)).toEqual(['today', 'tomorrow', 'later']);
    expect(groups[0].competitions).toHaveLength(2);
    expect(groups[1].competitions[0].competition).toBe('ProDay');
    expect(groups[2].competitions[0].items).toHaveLength(1);
  });
});
