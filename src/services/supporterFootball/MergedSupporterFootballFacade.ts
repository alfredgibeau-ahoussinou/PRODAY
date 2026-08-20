import type { Follow } from '../../models/Follow';
import type { TeamEvent } from '../../models/TeamEvent';
import type { Tournament } from '../../models/Tournament';
import { CompositeExternalFootballProvider } from './CompositeExternalFootballProvider';
import { DemoFootballProvider } from './DemoFootballProvider';
import { ProDayFootballProvider } from './ProDayFootballProvider';
import type { SupporterFootballProvider } from './provider';
import { isSupporterFootballDemoForced } from './sportmonksClient';
import {
  filterMatchesForFollows,
  resolveFootballDataTeamId,
} from './teamFollowMatch';
import { addDays, ymd } from './mappers';
import type {
  FixtureQuery,
  ProviderHealth,
  SearchResult,
  UnifiedCompetitionRef,
  UnifiedLineups,
  UnifiedMatch,
  UnifiedMatchEvent,
  UnifiedStandingRow,
  UnifiedStatistics,
  UnifiedTeamRef,
} from './types';

export type MatchCenterTabId = 'resume' | 'composition' | 'statistiques' | 'evenements' | 'video';

export interface MatchCenterPayload {
  match: UnifiedMatch;
  tabs: MatchCenterTabId[];
}

function dedupeById(matches: UnifiedMatch[]): UnifiedMatch[] {
  const seen = new Set<string>();
  const out: UnifiedMatch[] = [];
  for (const m of matches) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    out.push(m);
  }
  return out;
}

function sortByDateAsc(a: UnifiedMatch, b: UnifiedMatch): number {
  return a.date.getTime() - b.date.getTime();
}

function sortByDateDesc(a: UnifiedMatch, b: UnifiedMatch): number {
  return b.date.getTime() - a.date.getTime();
}

/** Strip demo fixtures unless demo mode is explicitly forced. */
export function rejectDemoUnlessForced(matches: UnifiedMatch[], demoForced: boolean): UnifiedMatch[] {
  if (demoForced) return matches;
  return matches.filter((m) => m.source !== 'demo');
}

function resolveExternalProvider(demoForced: boolean): SupporterFootballProvider {
  // Demo ONLY when EXPO_PUBLIC_SUPPORTER_FOOTBALL_DEMO=1. Otherwise Sportmonks
  // + football-data.org composite — never invent fixtures when the API is empty.
  if (demoForced) return new DemoFootballProvider();
  return new CompositeExternalFootballProvider();
}

/**
 * Merged facade — ProDay (teamEvents) + external Sportmonks + football-data.org.
 * Demo fixtures are never mixed into Live / lists unless DEMO=1 is forced.
 */
export class MergedSupporterFootballFacade implements SupporterFootballProvider {
  readonly name = 'merged-supporter';

  private external: SupporterFootballProvider;
  private proday: ProDayFootballProvider;
  private demoForced: boolean;

  constructor(
    calendarEvents: TeamEvent[] = [],
    tournaments: Tournament[] = [],
  ) {
    this.proday = new ProDayFootballProvider(calendarEvents, tournaments);
    this.demoForced = isSupporterFootballDemoForced();
    this.external = resolveExternalProvider(this.demoForced);
  }

  private sanitize(matches: UnifiedMatch[]): UnifiedMatch[] {
    return rejectDemoUnlessForced(matches, this.demoForced);
  }

  async getHealth(): Promise<ProviderHealth> {
    const ext = await this.external.getHealth();
    if (this.demoForced) {
      return {
        name: this.name,
        ready: true,
        mode: 'demo',
        message:
          'Mode démo forcé (EXPO_PUBLIC_SUPPORTER_FOOTBALL_DEMO=1). ProDay reste réel.',
      };
    }
    return {
      name: this.name,
      ready: true,
      mode: ext.mode === 'live' ? 'live' : 'empty',
      message: ext.message,
      availableLeagueIds: ext.availableLeagueIds,
      missingPreferredLeagueIds: ext.missingPreferredLeagueIds,
    };
  }

  async getFixtures(query?: FixtureQuery): Promise<UnifiedMatch[]> {
    const [proday, external] = await Promise.all([
      this.proday.getFixtures(query),
      this.external.getFixtures(query).catch(() => [] as UnifiedMatch[]),
    ]);
    return this.sanitize(dedupeById([...proday, ...external])).sort(sortByDateAsc);
  }

  async getLive(): Promise<UnifiedMatch[]> {
    const [proday, external] = await Promise.all([
      this.proday.getLive(),
      this.external.getLive().catch(() => [] as UnifiedMatch[]),
    ]);
    return this.sanitize(dedupeById([...proday, ...external])).sort(sortByDateAsc);
  }

  async getUpcoming(days = 7): Promise<UnifiedMatch[]> {
    const [proday, external] = await Promise.all([
      this.proday.getUpcoming(days),
      this.external.getUpcoming(days).catch(() => [] as UnifiedMatch[]),
    ]);
    return this.sanitize(dedupeById([...proday, ...external])).sort(sortByDateAsc);
  }

  async getFinished(days = 3): Promise<UnifiedMatch[]> {
    const [proday, external] = await Promise.all([
      this.proday.getFinished(days),
      this.external.getFinished(days).catch(() => [] as UnifiedMatch[]),
    ]);
    return this.sanitize(dedupeById([...proday, ...external])).sort(sortByDateDesc);
  }

  async getMatch(id: string): Promise<UnifiedMatch | null> {
    if (id.startsWith('proday-')) return this.proday.getMatch(id);
    if (id.startsWith('demo-')) {
      if (!this.demoForced) return null;
      return this.external.getMatch(id);
    }
    const external = await this.external.getMatch(id).catch(() => null);
    if (external) return external;
    return this.proday.getMatch(id);
  }

  async getLineups(matchId: string): Promise<UnifiedLineups | null> {
    const match = await this.getMatch(matchId);
    if (match?.lineup) return match.lineup;
    if (matchId.startsWith('proday-')) return this.proday.getLineups(matchId);
    return this.external.getLineups(matchId).catch(() => null);
  }

  async getEvents(matchId: string): Promise<UnifiedMatchEvent[]> {
    const match = await this.getMatch(matchId);
    if (match?.events?.length) return match.events;
    if (matchId.startsWith('proday-')) return this.proday.getEvents(matchId);
    return this.external.getEvents(matchId).catch(() => []);
  }

  async getStatistics(matchId: string): Promise<UnifiedStatistics | null> {
    if (matchId.startsWith('proday-')) return this.proday.getStatistics(matchId);
    return this.external.getStatistics(matchId).catch(() => null);
  }

  async getTeams(query: string): Promise<UnifiedTeamRef[]> {
    return this.external.getTeams(query).catch(() => []);
  }

  async getTeam(teamId: string): Promise<UnifiedTeamRef | null> {
    return this.external.getTeam(teamId).catch(() => null);
  }

  async getCompetitions(country?: string): Promise<UnifiedCompetitionRef[]> {
    const [proday, external] = await Promise.all([
      this.proday.getCompetitions(country),
      this.external.getCompetitions(country).catch(() => [] as UnifiedCompetitionRef[]),
    ]);
    return [...proday, ...external];
  }

  async getStandings(competitionOrSeasonId: string): Promise<UnifiedStandingRow[]> {
    return this.external.getStandings(competitionOrSeasonId).catch(() => []);
  }

  async search(query: string): Promise<SearchResult> {
    const [proday, external] = await Promise.all([
      this.proday.search(query),
      this.external.search(query).catch(
        () => ({ matches: [], teams: [], competitions: [] }) as SearchResult,
      ),
    ]);
    return {
      matches: this.sanitize(dedupeById([...proday.matches, ...external.matches])),
      teams: external.teams,
      competitions: [...proday.competitions, ...external.competitions],
    };
  }

  async getMatchCenter(matchId: string): Promise<MatchCenterPayload | null> {
    const match = await this.getMatch(matchId);
    if (!match) return null;
    if (match.source === 'demo' && !this.demoForced) return null;
    const [lineup, events, statistics] = await Promise.all([
      match.lineup ? Promise.resolve(match.lineup) : this.getLineups(matchId),
      match.events ? Promise.resolve(match.events) : this.getEvents(matchId),
      match.statistics ? Promise.resolve(match.statistics) : this.getStatistics(matchId),
    ]);
    const full: UnifiedMatch = {
      ...match,
      lineup: lineup ?? match.lineup ?? null,
      events: events ?? match.events ?? null,
      statistics: statistics ?? match.statistics ?? null,
    };
    return { match: full, tabs: resolveMatchCenterTabs(full) };
  }

  /** ProDay-only slice (real calendar / tournaments — never demo). */
  async getProDayMatches(): Promise<UnifiedMatch[]> {
    return this.proday.getFixtures();
  }

  /** League / Sportmonks-only slice (never ProDay, never demo unless forced). */
  async getLeagueMatches(query?: FixtureQuery): Promise<UnifiedMatch[]> {
    const list = await this.external.getFixtures(query).catch(() => [] as UnifiedMatch[]);
    return this.sanitize(list).filter(
      (m) => m.source === 'external' || (this.demoForced && m.source === 'demo'),
    );
  }

  async getLeagueLive(): Promise<UnifiedMatch[]> {
    const list = await this.external.getLive().catch(() => [] as UnifiedMatch[]);
    return this.sanitize(list);
  }

  async getLeagueUpcoming(days = 7): Promise<UnifiedMatch[]> {
    const list = await this.external.getUpcoming(days).catch(() => [] as UnifiedMatch[]);
    return this.sanitize(list);
  }

  async getLeagueFinished(days = 3): Promise<UnifiedMatch[]> {
    const list = await this.external.getFinished(days).catch(() => [] as UnifiedMatch[]);
    return this.sanitize(list);
  }

  /**
   * Matches involving followed clubs — fetches FD `/teams/{id}/matches` when possible,
   * then falls back to name/alias filtering on the general pool.
   */
  async getFollowedClubMatches(follows: Follow[]): Promise<UnifiedMatch[]> {
    const clubFollows = follows.filter((f) => f.target_type === 'club');
    if (!clubFollows.length) return [];

    const from = ymd(addDays(new Date(), -21));
    const to = ymd(addDays(new Date(), 45));
    const teamIds = [
      ...new Set(
        clubFollows
          .map((f) => resolveFootballDataTeamId(f))
          .filter((n): n is number => n != null)
          .map((n) => `fd-team-${n}`),
      ),
    ];

    if (teamIds.length) {
      const teamFixtures = await this.external
        .getFixtures({ from, to, teamIds })
        .catch(() => [] as UnifiedMatch[]);
      const hit = filterMatchesForFollows(this.sanitize(teamFixtures), clubFollows);
      if (hit.length) return hit.sort(sortByDateAsc);
    }

    const [upcoming, finished] = await Promise.all([
      this.external.getUpcoming(45).catch(() => [] as UnifiedMatch[]),
      this.external.getFinished(21).catch(() => [] as UnifiedMatch[]),
    ]);
    const pool = this.sanitize(dedupeById([...upcoming, ...finished]));
    return filterMatchesForFollows(pool, clubFollows).sort(sortByDateAsc);
  }
}

export function resolveMatchCenterTabs(match: UnifiedMatch): MatchCenterTabId[] {
  const tabs: MatchCenterTabId[] = ['resume', 'composition', 'statistiques', 'evenements'];
  if (match.video?.rightsOk && match.video.url) tabs.push('video');
  return tabs;
}

export function createSupporterFootballFacade(
  calendarEvents: TeamEvent[] = [],
  tournaments: Tournament[] = [],
): MergedSupporterFootballFacade {
  return new MergedSupporterFootballFacade(calendarEvents, tournaments);
}

export { filterMatchesForFollows } from './teamFollowMatch';

export const supporterFootballFacade = {
  create: createSupporterFootballFacade,
  resolveMatchCenterTabs,
};
