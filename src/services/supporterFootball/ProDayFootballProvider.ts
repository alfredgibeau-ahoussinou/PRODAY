import type { TeamEvent } from '../../models/TeamEvent';
import type { Tournament } from '../../models/Tournament';
import { isMatchHubEligible, resolveLiveState } from '../../utils/matchLive';
import { extractProdayOfficialWatchUrl } from '../../utils/supporterBroadcast';
import { inferGenderFromCategories } from '../../utils/supporterMatchFilters';
import type { SupporterFootballProvider } from './provider';
import type {
  FixtureQuery,
  ProviderHealth,
  SearchResult,
  UnifiedCompetitionRef,
  UnifiedLineups,
  UnifiedMatch,
  UnifiedMatchEvent,
  UnifiedMatchStatus,
  UnifiedStandingRow,
  UnifiedStatistics,
  UnifiedTeamRef,
} from './types';

function mapGender(
  scope: 'men' | 'women' | 'mixed' | 'unspecified',
): UnifiedMatch['genderScope'] {
  if (scope === 'unspecified') return 'unknown';
  return scope;
}

function mapLiveToUnifiedStatus(status: string): UnifiedMatchStatus {
  if (status === 'live') return 'live';
  if (status === 'halftime') return 'halftime';
  if (status === 'finished') return 'finished';
  return 'scheduled';
}

function teamEventToUnified(event: TeamEvent, tournaments: Tournament[]): UnifiedMatch {
  const tournament = tournaments.find((t) => t.id === event.tournament_id);
  const live = resolveLiveState(event);
  const status = mapLiveToUnifiedStatus(live.status);
  const homeName = live.home_label ?? event.club_name ?? event.title;
  const awayName = live.opponent_name ?? 'Adversaire';

  const events: UnifiedMatchEvent[] = (event.live_actions ?? []).map((a) => ({
    id: a.id,
    type:
      a.type === 'goal'
        ? 'goal'
        : a.type === 'yellow_card'
          ? 'yellow_card'
          : a.type === 'red_card'
            ? 'red_card'
            : a.type === 'sub_in' || a.type === 'sub_out'
              ? 'substitution'
              : 'other',
    minute: a.minute,
    playerName: a.player_name,
    detail: a.type,
  }));

  let lineup: UnifiedLineups | null = null;
  if (event.lineup?.slots?.length) {
    const starters = event.lineup.slots.filter((s) => s.role === 'starter');
    const bench = event.lineup.slots.filter((s) => s.role === 'sub');
    lineup = {
      home: {
        teamId: event.club_id || 'proday-home',
        formation: event.lineup.formation,
        players: [...starters, ...bench].map((s) => ({
          id: s.uid,
          name: s.display_name,
          position: s.position_label,
          role: s.role === 'starter' ? 'starter' : 'bench',
        })),
      },
      away: null,
    };
  }

  const watch = extractProdayOfficialWatchUrl({
    public_watch_url: event.public_watch_url,
    description: event.description,
  });

  return {
    id: `proday-event-${event.id}`,
    source: 'proday',
    homeTeam: { id: event.club_id || 'proday-home', name: homeName },
    awayTeam: { id: 'proday-away', name: awayName },
    competition: {
      id: tournament?.id ? `proday-comp-${tournament.id}` : 'proday-comp',
      name: tournament?.title || 'Match ProDay',
      country: 'FR',
    },
    date: event.starts_at instanceof Date ? event.starts_at : new Date(event.starts_at),
    status,
    score: {
      home: status === 'scheduled' ? null : live.home_score,
      away: status === 'scheduled' ? null : live.away_score,
      minute: status === 'live' || status === 'halftime' ? live.minute ?? null : null,
      period: null,
    },
    genderScope: mapGender(inferGenderFromCategories(event.categories)),
    lineup,
    statistics: null,
    events: events.length ? events : null,
    video: watch ? { url: watch, label: 'Diffusion ProDay', rightsOk: true } : null,
    prodayEventId: event.id,
    venue: event.location_label || event.city || null,
  };
}

export class ProDayFootballProvider implements SupporterFootballProvider {
  readonly name = 'proday';

  constructor(
    private calendarEvents: TeamEvent[] = [],
    private tournaments: Tournament[] = [],
  ) {}

  async getHealth(): Promise<ProviderHealth> {
    return { name: this.name, ready: true, mode: 'live' };
  }

  private matches(): UnifiedMatch[] {
    return this.calendarEvents
      .filter((e) => isMatchHubEligible(e))
      .map((e) => teamEventToUnified(e, this.tournaments));
  }

  async getFixtures(query: FixtureQuery = {}): Promise<UnifiedMatch[]> {
    let list = this.matches();
    if (query.liveOnly) {
      list = list.filter((m) => m.status === 'live' || m.status === 'halftime');
    }
    return list;
  }

  async getLive(): Promise<UnifiedMatch[]> {
    return this.matches().filter((m) => m.status === 'live' || m.status === 'halftime');
  }

  async getUpcoming(_days?: number): Promise<UnifiedMatch[]> {
    const now = Date.now();
    return this.matches().filter((m) => m.status === 'scheduled' && m.date.getTime() >= now);
  }

  async getFinished(_days?: number): Promise<UnifiedMatch[]> {
    return this.matches().filter((m) => m.status === 'finished');
  }

  async getMatch(id: string): Promise<UnifiedMatch | null> {
    return this.matches().find((m) => m.id === id || m.prodayEventId === id) ?? null;
  }

  async getLineups(matchId: string): Promise<UnifiedLineups | null> {
    return (await this.getMatch(matchId))?.lineup ?? null;
  }

  async getEvents(matchId: string): Promise<UnifiedMatchEvent[]> {
    return (await this.getMatch(matchId))?.events ?? [];
  }

  async getStatistics(_matchId?: string): Promise<UnifiedStatistics | null> {
    return null;
  }

  async getTeams(_query?: string): Promise<UnifiedTeamRef[]> {
    return [];
  }

  async getTeam(_teamId?: string): Promise<UnifiedTeamRef | null> {
    return null;
  }

  async getCompetitions(_country?: string): Promise<UnifiedCompetitionRef[]> {
    return this.tournaments.map((t) => ({
      id: `proday-comp-${t.id}`,
      name: t.title,
      country: 'FR',
    }));
  }

  async getStandings(_id?: string): Promise<UnifiedStandingRow[]> {
    return [];
  }

  async search(query: string): Promise<SearchResult> {
    const q = query.toLowerCase();
    const matches = this.matches().filter(
      (m) =>
        m.homeTeam.name.toLowerCase().includes(q) ||
        m.awayTeam.name.toLowerCase().includes(q) ||
        m.competition.name.toLowerCase().includes(q),
    );
    return { matches, teams: [], competitions: await this.getCompetitions() };
  }
}
