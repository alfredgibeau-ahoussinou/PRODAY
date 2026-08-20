/**
 * Merges Sportmonks + football-data.org external feeds.
 * Dedupe by date+home+away; prefer richer payload. Never invents demo fixtures.
 */
import { isFootballDataTokenConfigured } from './footballDataClient';
import {
  FOOTBALL_DATA_COVERED_SPORTMONKS_IDS,
  mergeExternalMatchesPreferRicher,
} from './footballDataMappers';
import { FootballDataFootballProvider } from './FootballDataFootballProvider';
import { parseExternalFixtureId } from './mappers';
import type { SupporterFootballProvider } from './provider';
import { buildLeagueCoverageMessage, missingPreferredLeagues } from './sportmonksLeagues';
import { isSportmonksTokenConfigured } from './sportmonksClient';
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

export class CompositeExternalFootballProvider implements SupporterFootballProvider {
  readonly name = 'composite-external';

  private sportmonks = new SportmonksFootballProvider();
  private footballData = new FootballDataFootballProvider();

  async getHealth(): Promise<ProviderHealth> {
    const smConfigured = isSportmonksTokenConfigured();
    const fdConfigured = isFootballDataTokenConfigured();

    if (!smConfigured && !fdConfigured) {
      return {
        name: this.name,
        ready: false,
        mode: 'empty',
        message:
          'Scores ligues indisponibles. Configure EXPO_PUBLIC_SPORTMONKS_API_TOKEN et/ou EXPO_PUBLIC_FOOTBALL_DATA_TOKEN (Ligue 1 gratuite via football-data.org).',
      };
    }

    const [sm, fd] = await Promise.all([
      smConfigured
        ? this.sportmonks.getHealth()
        : Promise.resolve({
            name: 'sportmonks',
            ready: false,
            mode: 'empty' as const,
            availableLeagueIds: [] as number[],
            missingPreferredLeagueIds: missingPreferredLeagues([]),
          }),
      fdConfigured
        ? this.footballData.getHealth()
        : Promise.resolve({
            name: 'football-data',
            ready: false,
            mode: 'empty' as const,
          }),
    ]);

    const fdLive = fd.mode === 'live' && fd.ready;
    const smLive = sm.mode === 'live' && sm.ready;
    const coveredByFd = new Set(fdLive ? FOOTBALL_DATA_COVERED_SPORTMONKS_IDS : []);
    const smMissing =
      sm.missingPreferredLeagueIds ??
      missingPreferredLeagues(sm.availableLeagueIds ?? []);
    const stillMissing = smMissing.filter((id) => !coveredByFd.has(id));

    if (fdLive && stillMissing.length === 0) {
      const parts: string[] = [];
      if (smLive) parts.push('Sportmonks');
      parts.push('football-data.org (Ligue 1 / top ligues)');
      return {
        name: this.name,
        ready: true,
        mode: 'live',
        message: `Ligues via ${parts.join(' + ')}.`,
        availableLeagueIds: [
          ...(sm.availableLeagueIds ?? []),
          ...FOOTBALL_DATA_COVERED_SPORTMONKS_IDS,
        ],
        missingPreferredLeagueIds: undefined,
      };
    }

    if (fdLive && stillMissing.length > 0) {
      return {
        name: this.name,
        ready: true,
        mode: 'live',
        message: `Ligue 1 et top 5 via football-data.org. ${
          buildLeagueCoverageMessage({
            availableNames: [],
            missingPreferred: stillMissing,
          }) ?? ''
        }`.trim(),
        availableLeagueIds: [
          ...(sm.availableLeagueIds ?? []),
          ...FOOTBALL_DATA_COVERED_SPORTMONKS_IDS,
        ],
        missingPreferredLeagueIds: stillMissing,
      };
    }

    // Sportmonks only — keep honest Free Plan banner
    return {
      name: this.name,
      ready: smLive,
      mode: smLive ? 'live' : 'empty',
      message:
        sm.message ||
        (fdConfigured
          ? undefined
          : 'Ajoute EXPO_PUBLIC_FOOTBALL_DATA_TOKEN pour Ligue 1 (API gratuite football-data.org).'),
      availableLeagueIds: sm.availableLeagueIds,
      missingPreferredLeagueIds: stillMissing.length ? stillMissing : sm.missingPreferredLeagueIds,
    };
  }

  private async mergeLists(
    loadSm: () => Promise<UnifiedMatch[]>,
    loadFd: () => Promise<UnifiedMatch[]>,
  ): Promise<UnifiedMatch[]> {
    const [sm, fd] = await Promise.all([
      loadSm().catch(() => [] as UnifiedMatch[]),
      loadFd().catch(() => [] as UnifiedMatch[]),
    ]);
    return mergeExternalMatchesPreferRicher([sm, fd]);
  }

  async getFixtures(query?: FixtureQuery): Promise<UnifiedMatch[]> {
    return this.mergeLists(
      () => this.sportmonks.getFixtures(query),
      () => this.footballData.getFixtures(query),
    );
  }

  async getLive(): Promise<UnifiedMatch[]> {
    return this.mergeLists(
      () => this.sportmonks.getLive(),
      () => this.footballData.getLive(),
    );
  }

  async getUpcoming(days?: number): Promise<UnifiedMatch[]> {
    return this.mergeLists(
      () => this.sportmonks.getUpcoming(days),
      () => this.footballData.getUpcoming(days),
    );
  }

  async getFinished(days?: number): Promise<UnifiedMatch[]> {
    return this.mergeLists(
      () => this.sportmonks.getFinished(days),
      () => this.footballData.getFinished(days),
    );
  }

  async getMatch(id: string): Promise<UnifiedMatch | null> {
    if (id.startsWith('external-fd-') || parseFootballDataId(id) != null) {
      return this.footballData.getMatch(id);
    }
    if (id.startsWith('external-sm-') || parseExternalFixtureId(id) != null) {
      const sm = await this.sportmonks.getMatch(id).catch(() => null);
      if (sm) return sm;
    }
    const [sm, fd] = await Promise.all([
      this.sportmonks.getMatch(id).catch(() => null),
      this.footballData.getMatch(id).catch(() => null),
    ]);
    return sm ?? fd;
  }

  async getLineups(matchId: string): Promise<UnifiedLineups | null> {
    if (matchId.startsWith('external-fd-')) return this.footballData.getLineups(matchId);
    const sm = await this.sportmonks.getLineups(matchId).catch(() => null);
    if (sm) return sm;
    return this.footballData.getLineups(matchId).catch(() => null);
  }

  async getEvents(matchId: string): Promise<UnifiedMatchEvent[]> {
    if (matchId.startsWith('external-fd-')) return this.footballData.getEvents(matchId);
    const sm = await this.sportmonks.getEvents(matchId).catch(() => []);
    if (sm.length) return sm;
    return this.footballData.getEvents(matchId).catch(() => []);
  }

  async getStatistics(matchId: string): Promise<UnifiedStatistics | null> {
    if (matchId.startsWith('external-fd-')) return this.footballData.getStatistics(matchId);
    const sm = await this.sportmonks.getStatistics(matchId).catch(() => null);
    if (sm) return sm;
    return this.footballData.getStatistics(matchId).catch(() => null);
  }

  async getTeams(query: string): Promise<UnifiedTeamRef[]> {
    const [sm, fd] = await Promise.all([
      this.sportmonks.getTeams(query).catch(() => [] as UnifiedTeamRef[]),
      this.footballData.getTeams(query).catch(() => [] as UnifiedTeamRef[]),
    ]);
    const seen = new Set<string>();
    const out: UnifiedTeamRef[] = [];
    for (const t of [...sm, ...fd]) {
      const key = t.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(t);
    }
    return out;
  }

  async getTeam(teamId: string): Promise<UnifiedTeamRef | null> {
    if (teamId.startsWith('fd-team-')) return this.footballData.getTeam(teamId);
    return (
      (await this.sportmonks.getTeam(teamId).catch(() => null)) ??
      (await this.footballData.getTeam(teamId).catch(() => null))
    );
  }

  async getCompetitions(country?: string): Promise<UnifiedCompetitionRef[]> {
    const [sm, fd] = await Promise.all([
      this.sportmonks.getCompetitions(country).catch(() => [] as UnifiedCompetitionRef[]),
      this.footballData.getCompetitions(country).catch(() => [] as UnifiedCompetitionRef[]),
    ]);
    return [...sm, ...fd];
  }

  async getStandings(competitionOrSeasonId: string): Promise<UnifiedStandingRow[]> {
    if (competitionOrSeasonId.startsWith('fd-comp-')) {
      return this.footballData.getStandings(competitionOrSeasonId);
    }
    const sm = await this.sportmonks.getStandings(competitionOrSeasonId).catch(() => []);
    if (sm.length) return sm;
    return this.footballData.getStandings(competitionOrSeasonId).catch(() => []);
  }

  async search(query: string): Promise<SearchResult> {
    const [sm, fd] = await Promise.all([
      this.sportmonks.search(query).catch(
        () => ({ matches: [], teams: [], competitions: [] }) as SearchResult,
      ),
      this.footballData.search(query).catch(
        () => ({ matches: [], teams: [], competitions: [] }) as SearchResult,
      ),
    ]);
    return {
      matches: dedupeById(
        mergeExternalMatchesPreferRicher([sm.matches, fd.matches]),
      ),
      teams: [...sm.teams, ...fd.teams],
      competitions: [...sm.competitions, ...fd.competitions],
    };
  }
}

function parseFootballDataId(id: string): number | null {
  const m = /^external-fd-(\d+)$/.exec(id.trim());
  return m ? Number(m[1]) : null;
}
