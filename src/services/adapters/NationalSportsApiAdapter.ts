/**
 * PRODAY — Adaptateur API Sportive Agréée pour les Championnats Nationaux FFF.
 *
 * Couvre les championnats nationaux officiels :
 * - Ligue 1 McDonald's
 * - Ligue 2 BKT
 * - National 1 FFF
 * - Arkema Première Ligue (D1 Féminine)
 *
 * Fournit :
 * - Classements officiels avec règles de départage
 * - Calendriers et résultats certifiés
 * - Vrais scores en direct avec chronomètre et timeline réels (hasLiveTelemetry = true)
 */

import type {
  NormalizedStanding,
  NormalizedStandingRow,
  NormalizedFixture,
  NormalizedLiveScore,
  SourceProvenance,
} from './fffAdapterTypes';

export interface NationalLeagueMapping {
  prodayId: string;
  apiLeagueId: number;
  name: string;
  category: 'national' | 'feminines';
  divisionLabel: string;
}

export const NATIONAL_LEAGUES_CONFIG: Record<string, NationalLeagueMapping> = {
  ligue1: {
    prodayId: 'ligue1',
    apiLeagueId: 61,
    name: "Ligue 1 McDonald's",
    category: 'national',
    divisionLabel: 'Championnat de France',
  },
  ligue2: {
    prodayId: 'ligue2',
    apiLeagueId: 62,
    name: 'Ligue 2 BKT',
    category: 'national',
    divisionLabel: 'Championnat de France Ligue 2',
  },
  national1: {
    prodayId: 'national1',
    apiLeagueId: 4,
    name: 'National 1 FFF',
    category: 'national',
    divisionLabel: 'Championnat de France National',
  },
  d1_fem: {
    prodayId: 'd1_fem',
    apiLeagueId: 64,
    name: 'Arkema Première Ligue',
    category: 'feminines',
    divisionLabel: 'Élite Féminine FFF',
  },
};

export class NationalSportsApiAdapter {
  /**
   * Parse un payload JSON de classement API-Football vers notre modèle normalisé.
   */
  public static parseStandingsResponse(
    prodayId: string,
    json: unknown,
    season = '2026-2027',
  ): NormalizedStanding | null {
    const config = NATIONAL_LEAGUES_CONFIG[prodayId];
    if (!config || !json || typeof json !== 'object') return null;

    const root = json as Record<string, unknown>;
    const response = Array.isArray(root.response) ? (root.response as unknown[]) : [];
    if (response.length === 0) return null;

    const first = response[0] as Record<string, unknown>;
    const league = (first?.league && typeof first.league === 'object') ? (first.league as Record<string, unknown>) : null;
    if (!league) return null;

    const standingsArray = Array.isArray(league.standings) ? league.standings : [];
    // API-Football renvoie souvent un tableau de groupes [[{...}, {...}]]
    const flatStandings = Array.isArray(standingsArray[0]) ? (standingsArray[0] as unknown[]) : standingsArray;

    const rows: NormalizedStandingRow[] = [];

    flatStandings.forEach((entry, idx) => {
      if (!entry || typeof entry !== 'object') return;
      const item = entry as Record<string, unknown>;
      const team = (item.team && typeof item.team === 'object') ? (item.team as Record<string, unknown>) : {};
      const all = (item.all && typeof item.all === 'object') ? (item.all as Record<string, unknown>) : {};
      const goals = (all.goals && typeof all.goals === 'object') ? (all.goals as Record<string, unknown>) : {};

      const rank = Number(item.rank ?? idx + 1);
      const teamId = String(team.id ?? `team_${idx + 1}`);
      const teamName = String(team.name ?? `Équipe ${idx + 1}`).trim();
      const points = Number(item.points ?? 0);
      const played = Number(all.played ?? 0);
      const won = Number(all.win ?? 0);
      const drawn = Number(all.draw ?? 0);
      const lost = Number(all.lose ?? 0);
      const goalsFor = Number(goals.for ?? 0);
      const goalsAgainst = Number(goals.against ?? 0);
      const goalDiff = Number(item.goalsDiff ?? goalsFor - goalsAgainst);

      const formStr = String(item.form ?? '').toUpperCase();
      const form: Array<'V' | 'N' | 'D'> = formStr
        .split('')
        .map((c) => {
          if (c === 'W' || c === 'V' || c === 'G') return 'V';
          if (c === 'D' || c === 'N') return 'N';
          return 'D';
        })
        .slice(-5);

      rows.push({
        rank,
        teamId,
        teamName,
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        goalDiff,
        points,
        form: form.length > 0 ? form : ['V', 'N', 'D'],
      });
    });

    // Tri officiel FFF : points desc, diff desc, buts pour desc
    rows.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      return b.goalsFor - a.goalsFor;
    });

    // Réassignation du rang après tri
    rows.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    const provenance: SourceProvenance = {
      source: 'national_api_sports',
      sourceLabel: `Flux Officiel National (${config.name})`,
      externalId: String(config.apiLeagueId),
      syncedAt: new Date().toISOString(),
      syncHealth: 'ok',
    };

    return {
      id: config.prodayId,
      competitionName: config.name,
      season,
      category: config.category,
      divisionLabel: `${season} · ${config.divisionLabel}`,
      standings: rows,
      provenance,
    };
  }

  /**
   * Parse un calendrier / liste de matchs de l'API nationale.
   */
  public static parseFixturesResponse(
    prodayId: string,
    json: unknown,
    season = '2026-2027',
  ): NormalizedFixture[] {
    const config = NATIONAL_LEAGUES_CONFIG[prodayId];
    if (!config || !json || typeof json !== 'object') return [];

    const root = json as Record<string, unknown>;
    const response = Array.isArray(root.response) ? (root.response as unknown[]) : [];
    const fixtures: NormalizedFixture[] = [];

    response.forEach((item, idx) => {
      if (!item || typeof item !== 'object') return;
      const row = item as Record<string, unknown>;
      const fix = (row.fixture && typeof row.fixture === 'object') ? (row.fixture as Record<string, unknown>) : {};
      const teams = (row.teams && typeof row.teams === 'object') ? (row.teams as Record<string, unknown>) : {};
      const home = (teams.home && typeof teams.home === 'object') ? (teams.home as Record<string, unknown>) : {};
      const away = (teams.away && typeof teams.away === 'object') ? (teams.away as Record<string, unknown>) : {};
      const goals = (row.goals && typeof row.goals === 'object') ? (row.goals as Record<string, unknown>) : {};
      const statusObj = (fix.status && typeof fix.status === 'object') ? (fix.status as Record<string, unknown>) : {};

      const shortStatus = String(statusObj.short ?? '').toUpperCase();
      let status: NormalizedFixture['status'] = 'scheduled';
      let isConfirmed = false;

      if (['FT', 'AET', 'PEN'].includes(shortStatus)) {
        status = 'completed';
        isConfirmed = true;
      } else if (['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(shortStatus)) {
        status = 'ongoing';
      } else if (['PST', 'TBD'].includes(shortStatus)) {
        status = 'postponed';
      } else if (['CANC', 'ABD'].includes(shortStatus)) {
        status = 'cancelled';
      }

      const matchId = String(fix.id ?? `${prodayId}_m${idx + 1}`);
      const rawDate = String(fix.date ?? '');
      const datePart = rawDate.slice(0, 10) || new Date().toISOString().slice(0, 10);
      const timePart = rawDate.slice(11, 16) || '20:00';

      const venueObj = (fix.venue && typeof fix.venue === 'object') ? (fix.venue as Record<string, unknown>) : {};
      const venue = String(venueObj.name ?? venueObj.city ?? 'Stade Officiel');

      const leagueObj = (row.league && typeof row.league === 'object') ? (row.league as Record<string, unknown>) : {};
      const roundStr = String(leagueObj.round ?? '');
      const matchdayMatch = roundStr.match(/\d+/);
      const matchday = matchdayMatch ? parseInt(matchdayMatch[0], 10) : idx + 1;

      fixtures.push({
        id: matchId,
        competitionId: config.prodayId,
        competitionName: config.name,
        season,
        matchday,
        homeTeamId: String(home.id ?? `home_${idx}`),
        homeTeamName: String(home.name ?? 'Domicile'),
        awayTeamId: String(away.id ?? `away_${idx}`),
        awayTeamName: String(away.name ?? 'Extérieur'),
        date: datePart,
        time: timePart,
        venue,
        status,
        homeScore: typeof goals.home === 'number' ? goals.home : null,
        awayScore: typeof goals.away === 'number' ? goals.away : null,
        isResultConfirmed: isConfirmed,
        provenance: {
          source: 'national_api_sports',
          sourceLabel: `Flux Officiel National (${config.name})`,
          externalId: matchId,
          syncedAt: new Date().toISOString(),
          syncHealth: 'ok',
        },
      });
    });

    return fixtures;
  }

  /**
   * Parse un flux de score en direct avec chronomètre et événements réels.
   */
  public static parseLiveScoreResponse(json: unknown): NormalizedLiveScore | null {
    if (!json || typeof json !== 'object') return null;
    const root = json as Record<string, unknown>;
    const response = Array.isArray(root.response) ? (root.response as unknown[]) : [];
    if (response.length === 0) return null;

    const first = response[0] as Record<string, unknown>;
    const fix = (first.fixture && typeof first.fixture === 'object') ? (first.fixture as Record<string, unknown>) : {};
    const statusObj = (fix.status && typeof fix.status === 'object') ? (fix.status as Record<string, unknown>) : {};
    const teams = (first.teams && typeof first.teams === 'object') ? (first.teams as Record<string, unknown>) : {};
    const goals = (first.goals && typeof first.goals === 'object') ? (first.goals as Record<string, unknown>) : {};
    const eventsRaw = Array.isArray(first.events) ? (first.events as unknown[]) : [];

    const short = String(statusObj.short ?? '').toUpperCase();
    const elapsed = typeof statusObj.elapsed === 'number' ? statusObj.elapsed : undefined;

    let status: NormalizedLiveScore['status'] = 'scheduled';
    let clockRunning = false;
    let periodLabel: string | undefined;

    if (short === '1H') {
      status = 'live';
      clockRunning = true;
      periodLabel = '1ère mi-temps';
    } else if (short === 'HT') {
      status = 'halftime';
      clockRunning = false;
      periodLabel = 'Mi-temps';
    } else if (short === '2H') {
      status = 'live';
      clockRunning = true;
      periodLabel = '2ème mi-temps';
    } else if (['FT', 'AET', 'PEN'].includes(short)) {
      status = 'finished';
      clockRunning = false;
      periodLabel = 'Terminé';
    }

    const events: NormalizedLiveScore['events'] = [];
    eventsRaw.forEach((e, idx) => {
      if (!e || typeof e !== 'object') return;
      const it = e as Record<string, unknown>;
      const timeObj = (it.time && typeof it.time === 'object') ? (it.time as Record<string, unknown>) : {};
      const teamObj = (it.team && typeof it.team === 'object') ? (it.team as Record<string, unknown>) : {};
      const playerObj = (it.player && typeof it.player === 'object') ? (it.player as Record<string, unknown>) : {};

      const typeRaw = String(it.type ?? '').toLowerCase();
      let eventType: NormalizedLiveScore['events'][0]['type'] = 'goal';
      if (typeRaw.includes('card')) {
        eventType = String(it.detail ?? '').toLowerCase().includes('red') ? 'red_card' : 'yellow_card';
      } else if (typeRaw.includes('sub')) {
        eventType = 'substitution';
      }

      events.push({
        id: `ev_${idx + 1}`,
        minute: typeof timeObj.elapsed === 'number' ? timeObj.elapsed : undefined,
        type: eventType,
        team: String(teamObj.id) === String((teams.home as Record<string, unknown>)?.id) ? 'home' : 'away',
        playerName: String(playerObj.name ?? 'Joueur'),
        detail: String(it.detail ?? ''),
        timestamp: new Date().toISOString(),
      });
    });

    return {
      fixtureId: String(fix.id ?? 'unknown_match'),
      status,
      hasLiveTelemetry: true, // Vrai flux avec chronomètre officiel
      minute: elapsed,
      clockRunning,
      homeScore: Number(goals.home ?? 0),
      awayScore: Number(goals.away ?? 0),
      homeTeamName: String((teams.home as Record<string, unknown>)?.name ?? 'Domicile'),
      awayTeamName: String((teams.away as Record<string, unknown>)?.name ?? 'Extérieur'),
      periodLabel,
      events,
      sourceType: 'national_api_sports',
      lastUpdatedAt: new Date().toISOString(),
    };
  }
}
