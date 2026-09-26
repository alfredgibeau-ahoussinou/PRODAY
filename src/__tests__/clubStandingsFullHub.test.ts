import {
  buildCertifiedSeedLeague,
  frenchFootballStandingsService,
  FRENCH_LEAGUE_CATEGORIES,
} from '../services/frenchFootballStandings.service';
import { resolveActiveClubLeague } from '../features/club/hooks/clubLeagueResolution';

/**
 * Contrat honnête des classements (invariant DATA-01) : sans source réelle
 * (Firestore vide, scraper FFF injoignable), le service renvoie un shell vide
 * explicitement marqué — jamais de classement ni de buteur inventé.
 */
describe('Club Standings & League Exploration Hub', () => {
  describe('Dégradation vide (aucune donnée fictive)', () => {
    it('buildCertifiedSeedLeague renvoie un shell vide, non certifié, marqué indisponible', () => {
      const data = buildCertifiedSeedLeague('r1_idf_b', '2026-2027');

      expect(data).toBeDefined();
      expect(data.id).toBe('r1_idf_b');
      expect(data.standings).toEqual([]);
      expect(data.scorers).toEqual([]);
      expect(data.officialFffCertified).toBe(false);
      expect(data.source).toBe('no_source');
      expect(data.syncStatus).toBe('unavailable');
    });

    it('ne réinjecte jamais les anciens tableaux fictifs (FC ProDay, Kylian Perez…)', () => {
      const data = buildCertifiedSeedLeague('r1_idf_b', '2025-2026');
      const serialized = JSON.stringify(data);
      expect(serialized).not.toContain('FC ProDay');
      expect(serialized).not.toContain('Kylian Perez');
      expect(serialized).not.toContain('Racing CFF');
      expect(data.standings.length).toBe(0);
    });

    it('getLeagueStandings fournit le snapshot officiel certifié FFF', async () => {
      const data = await frenchFootballStandingsService.getLeagueStandings('d1_d92');
      expect(data.id).toBe('d1_d92');
      expect(data.standings.length).toBeGreaterThanOrEqual(10);
      expect(data.officialFffCertified).toBe(true);
    });

    it('getLeagueStandings pour une ligue inconnue => shell vide sans exception', async () => {
      const data = await frenchFootballStandingsService.getLeagueStandings('ligue_inconnue_x');
      expect(data.id).toBe('ligue_inconnue_x');
      expect(data.standings).toEqual([]);
      expect(data.officialFffCertified).toBe(false);
    });

    it('fetchLiveStandings hors ligne => shell vide marqué indisponible', async () => {
      const live = await frenchFootballStandingsService.fetchLiveStandings('d1_d92');
      expect(live.standings).toEqual([]);
      expect(live.syncStatus).toBe('unavailable');
      expect(live.source).toBe('no_source');
    });

    it('recherche de club sans correspondance => aucun résultat inventé', async () => {
      const res = await frenchFootballStandingsService.searchClubs('ClubInexistantXYZ999');
      expect(res).toEqual([]);
    });
  });

  describe('resolveActiveClubLeague (aucune poule fabriquée)', () => {
    it('sans rattachement FFF explicite => résolution nulle honnête', () => {
      const resolved = resolveActiveClubLeague({
        club: null,
        teams: [],
        linked: null,
        season: '2026-2027',
      });

      expect(resolved.leagueId).toBeNull();
      expect(resolved.teamId).toBeNull();
      expect(resolved.teamName).toBeNull();
      expect(resolved.source).toBeNull();
    });

    it('un club nommé n’obtient pas de poule inventée', () => {
      const resolved = resolveActiveClubLeague({
        club: { id: 'club_1', name: 'FC ProDay Elite' } as any,
        teams: [],
        linked: null,
        season: '2026-2027',
      });

      expect(resolved.leagueId).toBeNull();
      expect(resolved.teamId).toBeNull();
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

  describe('Exploration des Ligues Françaises (catalogue réel)', () => {
    it('contains all categories and major French leagues', () => {
      const categories = frenchFootballStandingsService.getCategories();
      expect(categories.length).toBeGreaterThanOrEqual(4);

      const categoryIds = categories.map((c) => c.id);
      expect(categoryIds).toContain('national');
      expect(categoryIds).toContain('regional_idf');
      expect(categoryIds).toContain('district_92');

      const natCategory = categories.find((c) => c.id === 'national');
      const natLeagueIds = natCategory?.leagues.map((l) => l.id);
      expect(natLeagueIds).toContain('ligue1');
      expect(natLeagueIds).toContain('ligue2');
      expect(natLeagueIds).toContain('national1');

      const regCategory = categories.find((c) => c.id === 'regional_idf');
      const regLeagueIds = regCategory?.leagues.map((l) => l.id);
      expect(regLeagueIds).toContain('r1_idf_b');

      const distCategory = categories.find((c) => c.id === 'district_92');
      const distLeagueIds = distCategory?.leagues.map((l) => l.id);
      expect(distLeagueIds).toContain('d1_d92');
    });

    it('le catalogue reste consultable avec données certifiées pour les ligues officielles', async () => {
      const l1 = await frenchFootballStandingsService.getLeagueStandings('ligue1');
      expect(l1.name).toContain('Ligue 1');
      expect(l1.standings.length).toBe(18);

      const d92 = await frenchFootballStandingsService.getLeagueStandings('d1_d92');
      expect(d92.name).toContain('District 92');
      expect(d92.standings.length).toBe(12);
    });
  });
});
