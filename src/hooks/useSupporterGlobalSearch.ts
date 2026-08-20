import { useCallback, useState } from 'react';
import { footballDataFacade } from '../services/footballData';
import { supporterVideoService } from '../services/supporterVideo.service';
import { SUPPORTER_COMPETITIONS_CATALOG } from '../content/supporterCompetitionsCatalog';
import { searchCuratedPopularClubs } from '../content/supporterPopularClubs';
import type { SupporterVideo } from '../models/SupporterVideo';
import type { FootballTeamHit } from '../services/footballData/types';
import type { SupporterMatchViewItem } from '../utils/supporterMatchFilters';
import { externalFixtureToMatchItem, teamEventToMatchItem } from '../utils/supporterMatchFilters';
import type { TeamEvent } from '../models/TeamEvent';

export type SupporterSearchGroup =
  | 'clubs'
  | 'matches'
  | 'competitions'
  | 'videos'
  | 'proday';

export interface SupporterGlobalSearchResult {
  group: SupporterSearchGroup;
  label: string;
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    matchItem?: SupporterMatchViewItem;
  }>;
}

export function useSupporterGlobalSearch(prodayEvents: TeamEvent[] = []) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SupporterGlobalSearchResult[]>([]);

  const search = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      setQuery(trimmed);
      if (trimmed.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const lower = trimmed.toLowerCase();
        const groups: SupporterGlobalSearchResult[] = [];

        const curatedClubs = searchCuratedPopularClubs(trimmed, 8);
        const remoteTeams: FootballTeamHit[] = await footballDataFacade.searchTeams(trimmed);
        const clubItems = [...curatedClubs, ...remoteTeams]
          .filter((c, i, arr) => arr.findIndex((x) => x.name === c.name) === i)
          .slice(0, 8)
          .map((c) => ({
            id: c.id,
            title: c.name,
            subtitle: c.country,
          }));
        if (clubItems.length) {
          groups.push({ group: 'clubs', label: 'Clubs', items: clubItems });
        }

        const compHits = SUPPORTER_COMPETITIONS_CATALOG.filter(
          (c) =>
            c.label.toLowerCase().includes(lower) ||
            c.country.toLowerCase().includes(lower),
        ).slice(0, 6);
        if (compHits.length) {
          groups.push({
            group: 'competitions',
            label: 'Compétitions',
            items: compHits.map((c) => ({
              id: c.id,
              title: c.label,
              subtitle: c.country,
            })),
          });
        }

        const upcoming = await footballDataFacade.listUpcomingFixtures(14);
        const live = await footballDataFacade.listLiveFixtures();
        const matchItems = [...live, ...upcoming]
          .map(externalFixtureToMatchItem)
          .filter(
            (m) =>
              m.homeLabel.toLowerCase().includes(lower) ||
              m.awayLabel.toLowerCase().includes(lower) ||
              (m.competitionLabel?.toLowerCase().includes(lower) ?? false),
          )
          .slice(0, 8)
          .map((m) => ({
            id: m.id,
            title: `${m.homeLabel} vs ${m.awayLabel}`,
            subtitle: m.competitionLabel,
            matchItem: m,
          }));
        if (matchItems.length) {
          groups.push({ group: 'matches', label: 'Matchs', items: matchItems });
        }

        if (lower.includes('proday')) {
          const prodayItems = prodayEvents.slice(0, 6).map((ev) => {
            const item = teamEventToMatchItem(ev);
            return {
              id: item.id,
              title: `${item.homeLabel} vs ${item.awayLabel}`,
              subtitle: 'ProDay',
              matchItem: item,
            };
          });
          groups.push({ group: 'proday', label: 'ProDay', items: prodayItems });
        }

        const videos: SupporterVideo[] = await supporterVideoService.listAvailable({
          prodayEvents,
          max: 6,
        });
        const videoHits = videos
          .filter((v) => v.title.toLowerCase().includes(lower))
          .slice(0, 6)
          .map((v) => ({ id: v.id, title: v.title, subtitle: v.competitionLabel }));
        if (videoHits.length) {
          groups.push({ group: 'videos', label: 'Vidéos', items: videoHits });
        }

        setResults(groups);
      } finally {
        setLoading(false);
      }
    },
    [prodayEvents],
  );

  return { query, setQuery, search, loading, results };
}
