import type { FederationClub, FederationChampionship, FederationCategory } from '../models/Federation';

const MOCK_CLUBS: FederationClub[] = [
  {
    id: 'fed-club-torcy',
    name: 'US TORCY PVM',
    city: 'Torcy',
    logoUrl: 'https://placehold.co/100x100/1E3A8A/FFFFFF?text=UST',
  },
  {
    id: 'fed-club-psg',
    name: 'PARIS SG',
    city: 'Paris',
    logoUrl: 'https://placehold.co/100x100/1D4ED8/FFFFFF?text=PSG',
  }
];

const MOCK_CHAMPS: FederationChampionship[] = [
  {
    id: 'c1',
    clubId: 'fed-club-torcy',
    name: 'Régional 1',
    division: 'R1',
    poule: 'Poule A',
    categoryTag: 'Seniors',
    teamsAvailable: ['Équipe 1', 'Équipe 2'],
  },
  {
    id: 'c2',
    clubId: 'fed-club-torcy',
    name: 'U16',
    division: 'D1',
    poule: 'Poule Unique',
    categoryTag: 'Jeunes',
    teamsAvailable: ['Équipe 1'],
  },
  {
    id: 'c3',
    clubId: 'fed-club-torcy',
    name: 'Féminines R2',
    division: 'R2',
    poule: 'Poule B',
    categoryTag: 'Féminines',
    teamsAvailable: ['Équipe 1'],
  },
];

export const federationService = {
  async searchClubs(query: string): Promise<FederationClub[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const q = query.toLowerCase();
        if (!q) return resolve([]);
        resolve(MOCK_CLUBS.filter((c) => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)));
      }, 500);
    });
  },

  async getClubChampionships(clubId: string): Promise<FederationChampionship[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_CHAMPS.filter((c) => c.clubId === clubId));
      }, 400);
    });
  },

  async triggerSync(clubId: string, champId: string, teamNum: string, onProgress: (pct: number) => void): Promise<{ importedCount: number; nextMatchStr: string }> {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 15;
        if (progress > 100) progress = 100;
        onProgress(progress);
        if (progress === 100) {
          clearInterval(interval);
          resolve({
            importedCount: 18,
            nextMatchStr: 'Dim 12 Nov. • 15h00 vs US Créteil',
          });
        }
      }, 400);
    });
  }
};
