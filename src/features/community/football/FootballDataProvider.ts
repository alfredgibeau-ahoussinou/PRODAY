/**
 * Interface mince pour une future intégration football (pôle Supporter).
 * Stub uniquement — aucun provider réel, aucune donnée inventée.
 */

export type FootballFixtureId = string;
export type FootballTeamId = string;
export type FootballCompetitionId = string;

export type FootballFixtureStub = { id: FootballFixtureId };
export type FootballMatchStub = { id: FootballFixtureId };
export type FootballLineupStub = { matchId: FootballFixtureId };
export type FootballMatchEventStub = { matchId: FootballFixtureId };
export type FootballMatchStatisticsStub = { matchId: FootballFixtureId };
export type FootballStandingStub = { competitionId: FootballCompetitionId };
export type FootballTeamStub = { id: FootballTeamId };
export type FootballCompetitionStub = { id: FootballCompetitionId };

export interface FootballDataProvider {
  getFixtures(): Promise<FootballFixtureStub[]>;
  getLiveMatches(): Promise<FootballFixtureStub[]>;
  getMatch(id: FootballFixtureId): Promise<FootballMatchStub | null>;
  getLineups(matchId: FootballFixtureId): Promise<FootballLineupStub | null>;
  getMatchEvents(matchId: FootballFixtureId): Promise<FootballMatchEventStub[]>;
  getMatchStatistics(matchId: FootballFixtureId): Promise<FootballMatchStatisticsStub | null>;
  getStandings(competitionId: FootballCompetitionId): Promise<FootballStandingStub[]>;
  getTeams(): Promise<FootballTeamStub[]>;
  getCompetitions(): Promise<FootballCompetitionStub[]>;
}

/** Provider vide — prêt à être remplacé par une vraie source plus tard. */
export const stubFootballDataProvider: FootballDataProvider = {
  async getFixtures() {
    return [];
  },
  async getLiveMatches() {
    return [];
  },
  async getMatch() {
    return null;
  },
  async getLineups() {
    return null;
  },
  async getMatchEvents() {
    return [];
  },
  async getMatchStatistics() {
    return null;
  },
  async getStandings() {
    return [];
  },
  async getTeams() {
    return [];
  },
  async getCompetitions() {
    return [];
  },
};
