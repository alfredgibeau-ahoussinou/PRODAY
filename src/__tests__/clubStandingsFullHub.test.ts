import {
  buildCertifiedSeedLeague,
  frenchFootballStandingsService,
  FRENCH_LEAGUE_CATEGORIES,
} from '../services/frenchFootballStandings.service';
import { resolveActiveClubLeague } from '../features/club/hooks/clubLeagueResolution';

describe('Club Standings & League Exploration Hub', () => {
  describe('Poule Club (Seniors R1 · Poule B)', () => {
    it('provides official certified seed data for r1_idf_b (Seniors R1 Poule B)', () => {
      const data = buildCertifiedSeedLeague('r1_idf_b', '2026-2027');

      expect(data).toBeDefined();
      expect(data.id).toBe('r1_idf_b');
      expect(data.standings.length).toBe(12);

      // FC ProDay en tête du classement
      const leader = data.standings[0];
      expect(leader.rank).toBe(1);
      expect(leader.name).toBe('FC ProDay');
      expect(leader.points).toBe(39);
      expect(leader.played).toBe(16);
      expect(leader.won).toBe(12);
      expect(leader.drawn).toBe(3);
      expect(leader.lost).toBe(1);
      expect(leader.goal_diff).toBe(22);
      expect(leader.isMyTeam).toBe(true);
      expect(leader.form).toEqual(['V', 'V', 'V', 'N', 'V']);

      // 2e Racing CFF
      const second = data.standings[1];
      expect(second.rank).toBe(2);
      expect(second.name).toBe('Racing CFF');
      expect(second.points).toBe(36);

      // Buteurs
      expect(data.scorers.length).toBeGreaterThanOrEqual(3);
      expect(data.scorers[0].name).toBe('Kylian Perez');
      expect(data.scorers[0].club).toBe('FC ProDay');
      expect(data.scorers[0].goals).toBe(14);
    });

    it('provides archive 2025-2026 season for r1_idf_b', () => {
      const data = buildCertifiedSeedLeague('r1_idf_b', '2025-2026');
      expect(data.standings.length).toBe(12);
      expect(data.standings[0].name).toBe('FC ProDay');
      expect(data.standings[0].played).toBe(22);
      expect(data.standings[0].points).toBe(54);
    });
  });

  describe('resolveActiveClubLeague Fallback', () => {
    it('automatically defaults to r1_idf_b / FC ProDay when no explicit FFF link exists', () => {
      const resolved = resolveActiveClubLeague({
        club: null,
        teams: [],
        linked: null,
        season: '2026-2027',
      });

      expect(resolved.leagueId).toBe('r1_idf_b');
      expect(resolved.teamId).toBe('fc_proday');
      expect(resolved.teamName).toBe('FC ProDay');
      expect(resolved.divisionLabel).toContain('Régional 1');
    });

    it('uses custom club name in fallback if club has a name', () => {
      const resolved = resolveActiveClubLeague({
        club: { id: 'club_1', name: 'FC ProDay Elite' } as any,
        teams: [],
        linked: null,
        season: '2026-2027',
      });

      expect(resolved.leagueId).toBe('r1_idf_b');
      expect(resolved.teamName).toBe('FC ProDay Elite');
    });

    it('respects explicit team FFF attachment when configured', () => {
      const resolved = resolveActiveClubLeague({
        club: null,
        teams: [
          {
            id: 'team_u19',
            name: 'U19 Nationaux',
            fff_league_id: 'u19_nat_a',
            fff_season: '2026-2027',
            is_default: true,
          } as any,
        ],
        linked: null,
        season: '2026-2027',
      });

      expect(resolved.leagueId).toBe('u19_nat_a');
      expect(resolved.source).toBe('team');
    });
  });

  describe('Exploration des Autres Ligues Françaises', () => {
    it('contains all categories and major French leagues', () => {
      const categories = frenchFootballStandingsService.getCategories();
      expect(categories.length).toBeGreaterThanOrEqual(4);

      const categoryIds = categories.map((c) => c.id);
      expect(categoryIds).toContain('national');
      expect(categoryIds).toContain('regional_idf');
      expect(categoryIds).toContain('district_92');

      // Check National leagues
      const natCategory = categories.find((c) => c.id === 'national');
      const natLeagueIds = natCategory?.leagues.map((l) => l.id);
      expect(natLeagueIds).toContain('ligue1');
      expect(natLeagueIds).toContain('ligue2');
      expect(natLeagueIds).toContain('national1');

      // Check Regional Poule B
      const regCategory = categories.find((c) => c.id === 'regional_idf');
      const regLeagueIds = regCategory?.leagues.map((l) => l.id);
      expect(regLeagueIds).toContain('r1_idf_b');

      // Check Districts
      const distCategory = categories.find((c) => c.id === 'district_92');
      const distLeagueIds = distCategory?.leagues.map((l) => l.id);
      expect(distLeagueIds).toContain('d1_d92');
    });

    it('can load data for any league in France seamlessly', async () => {
      const l1 = await frenchFootballStandingsService.getLeagueStandings('ligue1');
      expect(l1.standings.length).toBeGreaterThan(0);
      expect(l1.name).toContain('Ligue 1');

      const d92 = await frenchFootballStandingsService.getLeagueStandings('d1_d92');
      expect(d92.standings.length).toBeGreaterThan(0);
      expect(d92.name).toContain('District 92');
    });
  });
});
