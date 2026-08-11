/**
 * Cloud Functions — competition validation trigger + external sync cron.
 */
import * as functions from 'firebase-functions';
import { admin } from './firebaseAdmin';

const db = admin.firestore();

interface StandingRow {
  team_id: string;
  display_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

function recomputeStandingsFromFixtures(
  teams: { id: string; display_name: string }[],
  fixtures: FirebaseFirestore.QueryDocumentSnapshot[],
): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  for (const t of teams) {
    rows.set(t.id, {
      team_id: t.id,
      display_name: t.display_name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      points: 0,
    });
  }

  for (const doc of fixtures) {
    const f = doc.data();
    if (f.status !== 'validated') continue;
    if (f.status === 'contested' || f.status === 'void') continue;
    if (typeof f.home_score !== 'number' || typeof f.away_score !== 'number') continue;
    const home = rows.get(String(f.home_team_id));
    const away = rows.get(String(f.away_team_id));
    if (!home || !away) continue;
    home.played += 1;
    away.played += 1;
    home.goals_for += f.home_score;
    home.goals_against += f.away_score;
    away.goals_for += f.away_score;
    away.goals_against += f.home_score;
    if (f.home_score > f.away_score) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (f.home_score < f.away_score) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  for (const row of rows.values()) {
    row.goal_difference = row.goals_for - row.goals_against;
  }

  return [...rows.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
    return b.goals_for - a.goals_for;
  });
}

/** Firestore trigger: when a fixture becomes validated, recompute standings. */
export const onCompetitionFixtureValidated = functions.firestore
  .document('competition_fixtures/{fixtureId}')
  .onWrite(async (change, context) => {
    const after = change.after.exists ? change.after.data() : null;
    const before = change.before.exists ? change.before.data() : null;
    if (!after) return;
    if (after.status !== 'validated') return;
    if (before?.status === 'validated' && after.status === 'validated') {
      // Only recompute if scores changed
      if (before.home_score === after.home_score && before.away_score === after.away_score) {
        return;
      }
    }

    const seasonId = String(after.season_id ?? '');
    if (!seasonId) return;

    const [teamsSnap, fixturesSnap] = await Promise.all([
      db.collection('competition_teams').where('season_id', '==', seasonId).get(),
      db.collection('competition_fixtures').where('season_id', '==', seasonId).get(),
    ]);

    const teams = teamsSnap.docs.map((d) => ({
      id: d.id,
      display_name: String(d.data().display_name ?? ''),
    }));
    const rows = recomputeStandingsFromFixtures(teams, fixturesSnap.docs);

    await db.collection('competition_standings').doc(seasonId).set(
      {
        season_id: seasonId,
        competition_id: after.competition_id ?? null,
        rows,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    functions.logger.info('Standings recomputed', {
      fixtureId: context.params.fixtureId,
      seasonId,
      rows: rows.length,
    });
  });

/**
 * Scheduled mirror of API-Football fixtures into competition_* collections.
 * Uses HTTP fetch with API key from functions config / env.
 */
export const syncExternalCompetitions = functions.pubsub
  .schedule('every 60 minutes')
  .onRun(async () => {
    const apiKey =
      process.env.EXTERNAL_SCORES_API_KEY ||
      functions.config()?.external_scores?.api_key ||
      '';
    if (!apiKey) {
      functions.logger.warn('syncExternalCompetitions skipped: no API key');
      return null;
    }

    const baseUrl =
      process.env.EXTERNAL_SCORES_API_URL || 'https://v3.football.api-sports.io';
    const leagues: { id: number; key: string; label: string }[] = [
      { id: 61, key: 'ligue1', label: 'Ligue 1' },
      { id: 64, key: 'd1f', label: 'D1 Arkema' },
    ];

    const seasonYear = new Date().getFullYear();

    for (const league of leagues) {
      try {
        const url = `${baseUrl}/fixtures?league=${league.id}&season=${seasonYear}&next=20`;
        const res = await fetch(url, {
          headers: { 'x-apisports-key': apiKey },
        });
        if (!res.ok) {
          functions.logger.warn('API-Football error', { status: res.status, league: league.key });
          continue;
        }
        const json = (await res.json()) as {
          response?: Array<{
            fixture: { id: number; date: string; status: { short: string } };
            teams: { home: { name: string }; away: { name: string } };
            goals: { home: number | null; away: number | null };
          }>;
        };

        // Ensure season doc
        const seasonRef = db.collection('competition_seasons').doc(`ext_${league.key}`);
        const seasonSnap = await seasonRef.get();
        if (!seasonSnap.exists) {
          const compRef = db.collection('competitions').doc(`ext_${league.key}`);
          await compRef.set(
            {
              name: league.label,
              format: 'league',
              season_label: String(seasonYear),
              organizer_uids: ['system_sync'],
              club_ids: [],
              rules: { points_win: 3, points_draw: 1, points_loss: 0, contest_hours: 48 },
              created_by: 'system_sync',
              created_at: admin.firestore.FieldValue.serverTimestamp(),
              updated_at: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
          await seasonRef.set(
            {
              competition_id: compRef.id,
              competition_name: league.label,
              label: `${league.label} (miroir)`,
              starts_at: admin.firestore.Timestamp.now(),
              status: 'active',
              organizer_uids: ['system_sync'],
              external_provider: 'api-football',
              external_season_id: league.key,
              created_at: admin.firestore.FieldValue.serverTimestamp(),
              updated_at: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        }

        const competitionId = `ext_${league.key}`;
        const seasonId = `ext_${league.key}`;

        for (const row of json.response ?? []) {
          const short = row.fixture.status.short;
          let status = 'scheduled';
          if (['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'BT'].includes(short)) status = 'live';
          if (['FT', 'AET', 'PEN'].includes(short)) status = 'validated';

          await db
            .collection('competition_fixtures')
            .doc(`ext_api_${row.fixture.id}`)
            .set(
              {
                season_id: seasonId,
                competition_id: competitionId,
                matchday: 0,
                home_team_id: `ext_h_${row.fixture.id}`,
                away_team_id: `ext_a_${row.fixture.id}`,
                home_name: row.teams.home.name,
                away_name: row.teams.away.name,
                kickoff_at: admin.firestore.Timestamp.fromDate(new Date(row.fixture.date)),
                status,
                home_score: row.goals.home,
                away_score: row.goals.away,
                source: 'external',
                external_fixture_id: String(row.fixture.id),
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
                created_at: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true },
            );
        }
      } catch (err) {
        functions.logger.error('syncExternalCompetitions league failed', {
          league: league.key,
          err,
        });
      }
    }

    return null;
  });
