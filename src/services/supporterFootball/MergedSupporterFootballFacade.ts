import type { Follow } from '../../models/Follow';
import type { TeamEvent } from '../../models/TeamEvent';
import type { Tournament } from '../../models/Tournament';
import { DemoFootballProvider } from './DemoFootballProvider';
import { ProDayFootballProvider } from './ProDayFootballProvider';
import type { SupporterFootballProvider } from './provider';
import {
  isSportmonksTokenConfigured,
  isSupporterFootballDemoForced,
} from './sportmonksClient';
import { SportmonksFootballProvider } from './SportmonksFootballProvider';
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

/**
 * Merged facade — ProDay (teamEvents) + external Sportmonks OR demo.
 * Demo is never mixed silently with live Sportmonks data.
 */
export class MergedSupporterFootballFacade implements SupporterFootballProvider {
  readonly name = 'merged-supporter';

  private external: SupporterFootballProvider;
  private proday: ProDayFootballProvider;
  private demoMode: boolean;

  constructor(
    calendarEvents: TeamEvent[] = [],
    tournaments: Tournament[] = [],
  ) {
    this.proday = new ProDayFootballProvider(calendarEvents, tournaments);
    this.demoMode = isSupporterFootballDemoForced() || !isSportmonksTokenConfigured();
    this.external = this.demoMode
      ? new DemoFootballProvider()
      : new SportmonksFootballProvider();
  }

  async getHealth(): Promise<ProviderHealth> {
    const ext = await this.external.getHealth();
    return {
      name: this.name,
      ready: true,
      mode: this.demoMode ? 'demo' : ext.mode,
      message: this.demoMode
        ? 'Mode démo (source: demo). ProDay reste réel. Ajoute EXPO_PUBLIC_SPORTMONKS_API_TOKEN ou le proxy.'
        : ext.message,
    };
  }

  async getFixtures(query?: FixtureQuery): Promise<UnifiedMatch[]> {
    const [proday, external] = await Promise.all([
      this.proday.getFixtures(query),
      this.external.getFixtures(query).catch(() => [] as UnifiedMatch[]),
    ]);
    return dedupeById([...proday, ...external]).sort(sortByDateAsc);
  }

  async getLive(): Promise<UnifiedMatch[]> {
    const [proday, external] = await Promise.all([
      this.proday.getLive(),
      this.external.getLive().catch(() => [] as UnifiedMatch[]),
    ]);
    return dedupeById([...proday, ...external]).sort(sortByDateAsc);
  }

  async getUpcoming(days = 7): Promise<UnifiedMatch[]> {
    const [proday, external] = await Promise.all([
      this.proday.getUpcoming(days),
      this.external.getUpcoming(days).catch(() => [] as UnifiedMatch[]),
    ]);
    return dedupeById([...proday, ...external]).sort(sortByDateAsc);
  }

  async getFinished(days = 3): Promise<UnifiedMatch[]> {
    const [proday, external] = await Promise.all([
      this.proday.getFinished(days),
      this.external.getFinished(days).catch(() => [] as UnifiedMatch[]),
    ]);
    return dedupeById([...proday, ...external]).sort(sortByDateDesc);
  }

  async getMatch(id: string): Promise<UnifiedMatch | null> {
    if (id.startsWith('proday-')) return this.proday.getMatch(id);
    if (id.startsWith('demo-')) {
      if (!this.demoMode) return null;
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
      matches: dedupeById([...proday.matches, ...external.matches]),
      teams: external.teams,
      competitions: [...proday.competitions, ...external.competitions],
    };
  }

  async getMatchCenter(matchId: string): Promise<MatchCenterPayload | null> {
    const match = await this.getMatch(matchId);
    if (!match) return null;
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

  /** ProDay-only slice for Accueil carousel. */
  async getProDayMatches(): Promise<UnifiedMatch[]> {
    return this.proday.getFixtures();
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

/** Filter helpers for Clubs / favorites carousels. */
export function filterMatchesForFollows(matches: UnifiedMatch[], follows: Follow[]): UnifiedMatch[] {
  if (!follows.length) return [];
  const clubIds = new Set(
    follows.filter((f) => f.target_type === 'club').map((f) => f.target_id),
  );
  const labels = new Set(
    follows.map((f) => (f.target_label || '').toLowerCase()).filter(Boolean),
  );
  return matches.filter((m) => {
    if (clubIds.has(m.homeTeam.id) || clubIds.has(m.awayTeam.id)) return true;
    const home = m.homeTeam.name.toLowerCase();
    const away = m.awayTeam.name.toLowerCase();
    for (const label of labels) {
      if (home.includes(label) || away.includes(label) || label.includes(home) || label.includes(away)) {
        return true;
      }
    }
    return false;
  });
}

export const supporterFootballFacade = {
  create: createSupporterFootballFacade,
  resolveMatchCenterTabs,
};
