import type { FederationClub, FederationTeam } from '../models/Federation';

const MOCK_TEAMS: FederationTeam[] = [
  {
    id: 'fed-team-1',
    clubId: 'fed-club-1',
    name: 'TORCY PARIS VALLEE DE LA MARNE FOOTBALL U.S.',
    category: 'U16',
    division: 'D1',
    poule: 'Poule Unique',
  },
  {
    id: 'fed-team-2',
    clubId: 'fed-club-1',
    name: 'TORCY PARIS VALLEE DE LA MARNE FOOTBALL U.S.',
    category: 'U19',
    division: 'N2',
    poule: 'Poule A',
  },
  {
    id: 'fed-team-3',
    clubId: 'fed-club-2',
    name: 'PARIS SAINT-GERMAIN FC',
    category: 'U17',
    division: 'Nat',
    poule: 'Poule B',
  }
];

export const federationService = {
  /**
   * Simulate searching directly for a club/team string.
   */
  async searchTeams(query: string): Promise<FederationTeam[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const q = query.toLowerCase();
        if (!q) {
          resolve([]);
          return;
        }
        const matches = MOCK_TEAMS.filter((t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
        resolve(matches);
      }, 600);
    });
  },

  /**
   * Simulate a long-running sync job that dispatches progress events or just takes time.
   */
  async triggerSync(federationTeamId: string, localTeamId: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 4000);
    });
  }
};
