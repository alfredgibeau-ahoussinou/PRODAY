import type { ExternalCompetitionId, ExternalFixture } from './externalScores.types';
import { externalScoresService } from './externalScores.service';
import { competitionsService } from './competitions.service';
import type { CompetitionFixtureStatus } from '../models/Competition';

export interface ExternalCompetition {
  id: string;
  label: string;
  provider: 'api-football';
  external_season_hint?: string;
}

export interface CompetitionSyncAdapter {
  listCompetitions(): Promise<ExternalCompetition[]>;
  syncFixtures(seasonExternalId: string): Promise<number>;
  syncStandings(seasonExternalId: string): Promise<void>;
}

const EXTERNAL_COMPS: ExternalCompetition[] = [
  { id: 'ligue1', label: 'Ligue 1', provider: 'api-football', external_season_hint: 'ligue1' },
  { id: 'd1f', label: 'D1 Arkema', provider: 'api-football', external_season_hint: 'd1f' },
];

function mapExternalStatus(status: ExternalFixture['status']): CompetitionFixtureStatus {
  if (status === 'live') return 'live';
  if (status === 'finished') return 'validated';
  return 'scheduled';
}

/** Ensure a mirrored ProDay competition + season exist for an external league. */
async function ensureExternalSeason(
  competitionKey: ExternalCompetitionId,
  label: string,
  systemUid = 'system_sync',
): Promise<{ competitionId: string; seasonId: string }> {
  const seasons = await competitionsService.listSeasons();
  const existing = seasons.find(
    (s) => s.external_provider === 'api-football' && s.external_season_id === competitionKey,
  );
  if (existing) {
    return { competitionId: existing.competition_id, seasonId: existing.id };
  }

  const competitionId = await competitionsService.createCompetition({
    name: label,
    format: 'league',
    season_label: new Date().getFullYear().toString(),
    organizer_uids: [systemUid],
    created_by: systemUid,
  });
  const seasonId = await competitionsService.createSeason({
    competition_id: competitionId,
    label: `${label} (miroir)`,
    starts_at: new Date(),
    organizer_uids: [systemUid],
  });

  // Tag season as external via direct update through setSeasonStatus path —
  // use competitionsService upsert via list + we need a small patch helper.
  // Stored when syncing fixtures via competition_id linkage; mark on season doc
  // through fixtures upsert only if admin update available. For v1 we encode
  // external_season_id into fixture.external_fixture_id prefix and recreate
  // season metadata via competitionsService by writing standings id = seasonId.
  const { getDb } = await import('../lib/firebase');
  const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
  const database = getDb();
  if (database) {
    await updateDoc(doc(database, 'competition_seasons', seasonId), {
      external_provider: 'api-football',
      external_season_id: competitionKey,
      status: 'active',
      updated_at: serverTimestamp(),
    });
  }

  return { competitionId, seasonId };
}

export function createApiFootballCompetitionSyncAdapter(): CompetitionSyncAdapter {
  return {
    async listCompetitions() {
      return EXTERNAL_COMPS;
    },

    async syncFixtures(seasonExternalId: string) {
      const meta = EXTERNAL_COMPS.find((c) => c.id === seasonExternalId);
      if (!meta) return 0;

      const competitionKey = seasonExternalId as ExternalCompetitionId;
      const { competitionId, seasonId } = await ensureExternalSeason(
        competitionKey,
        meta.label,
      );

      const fixtures = await externalScoresService.listFixtures(competitionKey);
      let count = 0;
      for (const f of fixtures) {
        const status = mapExternalStatus(f.status);
        await competitionsService.upsertExternalFixture({
          id: `ext_${f.id}`,
          season_id: seasonId,
          competition_id: competitionId,
          matchday: 0,
          home_team_id: `ext_home_${f.id}`,
          away_team_id: `ext_away_${f.id}`,
          home_name: f.home_team,
          away_name: f.away_team,
          kickoff_at: f.starts_at,
          status,
          home_score: f.score_home ?? null,
          away_score: f.score_away ?? null,
          source: 'external',
          external_fixture_id: f.id,
          team_event_id: null,
        });
        count += 1;
      }

      if (count > 0) {
        await competitionsService.recomputeStandings(seasonId);
      }
      return count;
    },

    async syncStandings(seasonExternalId: string) {
      // Standings derived from mirrored validated fixtures
      const seasons = await competitionsService.listSeasons();
      const season = seasons.find(
        (s) =>
          s.external_provider === 'api-football' && s.external_season_id === seasonExternalId,
      );
      if (season) {
        await competitionsService.recomputeStandings(season.id);
      }
    },
  };
}

export const defaultCompetitionSyncAdapter = createApiFootballCompetitionSyncAdapter();

export async function syncAllExternalCompetitions(): Promise<{ synced: number }> {
  const adapter = defaultCompetitionSyncAdapter;
  const comps = await adapter.listCompetitions();
  let synced = 0;
  for (const c of comps) {
    synced += await adapter.syncFixtures(c.id);
    await adapter.syncStandings(c.id);
  }
  return { synced };
}
