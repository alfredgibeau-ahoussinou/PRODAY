import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TeamEvent } from '../models/TeamEvent';
import {
  fffScraperService,
  type FffFixture,
  type FffStandingRow,
  type MyFffTeamLink,
} from './fffScraper.service';
import { frenchFootballStandingsService } from './frenchFootballStandings.service';

const IMPORTED_FFF_EVENTS_KEY = '@proday_fff_imported_events_v1';

function getUpcomingMatchdayDate(): string {
  const d = new Date();
  // Calcule la date du prochain match (dimanche à venir) pour la saison 2026/2027
  const dayOfWeek = d.getDay();
  const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSunday);
  const y = d.getFullYear() < 2026 ? 2026 : d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}


export interface HeadToHeadMatchup {
  competitionName: string;
  divisionLabel: string;
  nextFixture: {
    matchday: number;
    date: string;
    time: string;
    venue: string;
    isHome: boolean;
  };
  myTeam: {
    id: string;
    name: string;
    rank: number;
    points: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDiff: number;
    form: Array<'V' | 'N' | 'D'>;
  };
  opponent: {
    id: string;
    name: string;
    rank: number;
    points: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDiff: number;
    form: Array<'V' | 'N' | 'D'>;
  };
  analysis: {
    pointsDiff: number;
    rankDiff: number;
    favorite: 'my_team' | 'opponent' | 'balanced';
    summary: string;
  };
}

export const fffCalendarSyncService = {
  /**
   * Récupère la liste des matchs officiels FFF importés localement.
   */
  async getImportedFffEvents(): Promise<TeamEvent[]> {
    try {
      const raw = await AsyncStorage.getItem(IMPORTED_FFF_EVENTS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
      return parsed.map((item) => ({
        ...(item as unknown as TeamEvent),
        starts_at: new Date(String(item.starts_at)),
        ends_at: item.ends_at ? new Date(String(item.ends_at)) : undefined,
        created_at: new Date(String(item.created_at || new Date().toISOString())),
        updated_at: new Date(String(item.updated_at || new Date().toISOString())),
      }));
    } catch {
      return [];
    }
  },

  /**
   * Enregistre les événements importés dans le stockage local.
   */
  async saveImportedFffEvents(events: TeamEvent[]): Promise<void> {
    try {
      await AsyncStorage.setItem(IMPORTED_FFF_EVENTS_KEY, JSON.stringify(events));
    } catch {
      // best-effort
    }
  },

  /**
   * Efface les événements FFF importés.
   */
  async clearImportedFffEvents(): Promise<void> {
    try {
      await AsyncStorage.removeItem(IMPORTED_FFF_EVENTS_KEY);
    } catch {
      // best-effort
    }
  },

  /**
   * Importation Automatique façon SportEasy :
   * Génère les TeamEvents pour toutes les rencontres officielles de l'équipe dans le championnat FFF.
   */
  async importFffCalendarToTeamEvents(
    leagueId: string,
    teamIdOrName: string,
    options?: {
      clubId?: string;
      clubName?: string;
      organizerUid?: string;
      organizerName?: string;
    },
  ): Promise<{ importedCount: number; events: TeamEvent[] }> {
    // Récupérer les données du championnat (cloud ou fallback)
    const leagueData = await frenchFootballStandingsService.getLeagueStandings(leagueId);
    const divisionLabel = leagueData.divisionLabel || 'Championnat FFF Officiel';
    const query = teamIdOrName.toLowerCase();

    // Récupérer les fixtures depuis le scraper (maintenant vides — voir getFixturesForTeam)
    // Les vraies fixtures arrivent via Firestore fff_league_standings.{leagueId}.fixtures
    const fixtures = fffScraperService.getFixturesForTeam(leagueId, teamIdOrName);

    if (fixtures.length === 0) {
      // Aucune fixture disponible pour l'instant (les données live arrivent via sync quotidien)
      return { importedCount: 0, events: [] };
    }

    const newEvents: TeamEvent[] = fixtures.map((fixture) => {
      const isHome =
        fixture.homeTeamId.toLowerCase() === query ||
        fixture.homeTeamName.toLowerCase().includes(query);

      const opponentName = isHome ? fixture.awayTeamName : fixture.homeTeamName;
      const myTeamName = isHome ? fixture.homeTeamName : fixture.awayTeamName;
      const startsAt = new Date(`${fixture.date}T${fixture.time}:00`);
      const endsAt = new Date(startsAt.getTime() + 105 * 60 * 1000); // 1h45 de match

      const title = `J${fixture.matchday} · ${myTeamName} vs ${opponentName}`;
      const location = fixture.venue || `Stade de ${isHome ? myTeamName : opponentName}`;

      return {
        id: `fff_fixture_${fixture.id}`,
        title,
        description: `Rencontre officielle FFF · ${divisionLabel}\nCoup d'envoi officiel à ${fixture.time}. Convocations gérées via ProDay.`,
        event_type: 'competition',
        organizer_uid: options?.organizerUid || 'staff_proday_fff',
        organizer_name: options?.organizerName || 'Staff Officiel FFF',
        club_id: options?.clubId,
        club_name: options?.clubName || myTeamName,
        team_id: isHome ? fixture.homeTeamId : fixture.awayTeamId,
        competition_fixture_id: fixture.id,
        starts_at: startsAt,
        ends_at: endsAt,
        city: fixture.venue?.split('(')[1]?.replace(')', '').trim() || 'Île-de-France',
        location_label: location,
        invitee_uids: [],
        rsvps: {},
        created_at: new Date(),
        updated_at: new Date(),
      };
    });

    // Fusionner avec les événements précédemment importés en évitant les doublons
    const existing = await this.getImportedFffEvents();
    const existingIds = new Set(newEvents.map((e) => e.id));
    const merged = [...newEvents, ...existing.filter((e) => !existingIds.has(e.id))];

    await this.saveImportedFffEvents(merged);

    // Enregistrer l'équipe comme "Mon Équipe FFF" liée
    const myRow = leagueData.standings.find(
      (r) =>
        r.team_id.toLowerCase() === query ||
        r.name.toLowerCase().includes(query),
    );

    if (myRow) {
      const link: MyFffTeamLink = {
        leagueId,
        teamId: myRow.team_id,
        teamName: myRow.name,
        districtCode: leagueData.districtCode,
        divisionLabel: leagueData.divisionLabel,
        linkedAt: new Date().toISOString(),
      };
      await fffScraperService.setMyFffTeam(link);
    }

    return { importedCount: newEvents.length, events: newEvents };
  },

  /**
   * Calcule le Face-à-Face / Scouting d'avant-match (Head-to-Head SportEasy).
   */
  async getHeadToHeadMatchup(
    leagueId: string,
    myTeamIdOrName: string,
    specificOpponent?: string,
  ): Promise<HeadToHeadMatchup | null> {
    // Récupérer les données du championnat (cloud ou fallback)
    const leagueData = await frenchFootballStandingsService.getLeagueStandings(leagueId);
    if (!leagueData || !leagueData.standings || leagueData.standings.length === 0) {
      return null;
    }

    const comp = leagueData;
    const myQuery = myTeamIdOrName.toLowerCase();
    const myRow = comp.standings.find(
      (r) =>
        r.team_id.toLowerCase() === myQuery ||
        r.name.toLowerCase().includes(myQuery),
    );

    if (!myRow) return null;

    let nextFix: FffFixture | null = null;
    let oppRow: FffStandingRow | undefined;

    if (specificOpponent) {
      const oppQuery = specificOpponent.toLowerCase();
      oppRow = comp.standings.find(
        (r) =>
          r.team_id.toLowerCase() === oppQuery ||
          r.name.toLowerCase().includes(oppQuery),
      );
    }

    if (!oppRow) {
      nextFix = fffScraperService.getNextFixture(leagueId, myTeamIdOrName);
      if (nextFix) {
        const isHome =
          nextFix.homeTeamId.toLowerCase() === myQuery ||
          nextFix.homeTeamName.toLowerCase().includes(myQuery);
        const oppId = isHome ? nextFix.awayTeamId : nextFix.homeTeamId;
        const oppName = isHome ? nextFix.awayTeamName : nextFix.homeTeamName;

        oppRow = comp.standings.find(
          (r) =>
            r.team_id.toLowerCase() === oppId.toLowerCase() ||
            r.name.toLowerCase().includes(oppName.toLowerCase()),
        );
      }
    }

    if (!oppRow) {
      // Fallback sur le 4e du classement si pas d'adversaire trouvé
      oppRow = comp.standings[Math.min(3, comp.standings.length - 1)];
    }

    if (!oppRow) return null;

    const isHome = nextFix
      ? nextFix.homeTeamId.toLowerCase() === myQuery ||
        nextFix.homeTeamName.toLowerCase().includes(myQuery)
      : true;

    const pointsDiff = myRow.points - oppRow.points;
    const rankDiff = oppRow.rank - myRow.rank; // positif = mon équipe est mieux classée

    let favorite: 'my_team' | 'opponent' | 'balanced' = 'balanced';
    let summary = 'Choc équilibré de milieu de tableau.';

    if (rankDiff >= 3 || pointsDiff >= 6) {
      favorite = 'my_team';
      summary = `${myRow.name} aborde la rencontre avec l'avantage du classement et des points (+${pointsDiff} pts).`;
    } else if (rankDiff <= -3 || pointsDiff <= -6) {
      favorite = 'opponent';
      summary = `${oppRow.name} est mieux positionné au classement (#${oppRow.rank}) avec une dynamique solide.`;
    } else {
      summary = `Duel serré : seulement ${Math.abs(pointsDiff)} pt(s) d'écart entre ${myRow.name} (#${myRow.rank}) et ${oppRow.name} (#${oppRow.rank}).`;
    }

    return {

      competitionName: comp.name,
      divisionLabel: comp.divisionLabel,
      nextFixture: {
        matchday: nextFix?.matchday ?? 15,
        date: nextFix?.date && !nextFix.date.startsWith('2025') ? nextFix.date : getUpcomingMatchdayDate(),
        time: nextFix?.time ?? '15:00',
        venue: nextFix?.venue ?? 'Stade Maurice Hubert',
        isHome,
      },

      myTeam: {
        id: myRow.team_id,
        name: myRow.name,
        rank: myRow.rank,
        points: myRow.points,
        played: myRow.played,
        won: myRow.won,
        drawn: myRow.drawn,
        lost: myRow.lost,
        goalsFor: myRow.goals_for,
        goalsAgainst: myRow.goals_against,
        goalDiff: myRow.goal_diff,
        form: myRow.form,
      },
      opponent: {
        id: oppRow.team_id,
        name: oppRow.name,
        rank: oppRow.rank,
        points: oppRow.points,
        played: oppRow.played,
        won: oppRow.won,
        drawn: oppRow.drawn,
        lost: oppRow.lost,
        goalsFor: oppRow.goals_for,
        goalsAgainst: oppRow.goals_against,
        goalDiff: oppRow.goal_diff,
        form: oppRow.form,
      },
      analysis: {
        pointsDiff,
        rankDiff,
        favorite,
        summary,
      },
    };
  },
};
