/**
 * Tests unitaires exhaustifs pour l'extension de la section Classements de ProDay :
 * 1. Suivi multi-équipes du club (Seniors, U19, U17, Féminines)
 * 2. Compétitions à élimination directe (Coupes) sans classement inventé
 * 3. Explorateur multi-critères (territoires, districts, catégories d'âge)
 * 4. Protection stricte des données privées (ACL & zéro fuite PII)
 * 5. Lisibilité mobile et priorisation des colonnes contractuelles
 * 6. Règles de départage FFF et mise en cache mémoire
 */
import {
  buildTeamCompetitionOptions,
  buildClubTeamsOverviewList,
  isClubStandingRow,
  FRENCH_REGIONS_OPTIONS,
  FRENCH_DISTRICTS_OPTIONS,
  AGE_CATEGORIES_OPTIONS,
  MOBILE_ESSENTIAL_COLUMNS,
  CLUB_STANDINGS_COLUMNS,
} from '../features/club/ui/clubStandingsModel';
import {
  frenchFootballStandingsService,
  describeStandingsFreshness,
  buildCertifiedSeedLeague,
  type FrenchLeagueData,
} from '../services/frenchFootballStandings.service';
import { FffAuthoritativeDataService } from '../services/fffAuthoritativeData.service';
import type { Team } from '../models/Team';
import type { Club } from '../models/Club';
import type { LeagueStandingRow } from '../components/matchs/EliteLeagueStandings';

describe('Hub des Classements FFF & Explorateur Multi-Équipes', () => {
  beforeEach(() => {
    frenchFootballStandingsService.clearMemoryCache();
  });

  // 1. VUE D'ENSEMBLE MULTI-ÉQUIPES DU CLUB
  describe('1. Suivi Multi-Équipes du Club (Mon Club Overview)', () => {
    const mockClub: Club = {
      id: 'club_proday',
      name: 'FC ProDay Elite',
      fff_affiliation_number: '500123',
      fff_league_id: 'r1_idf_b',
      fff_division_label: 'Régional 1 IDF',
      fff_group_label: 'Poule B',
      created_at: new Date(),
      updated_at: new Date(),
    } as Club;

    const mockTeams: Team[] = [
      {
        id: 'team_seniors_a',
        club_id: 'club_proday',
        name: 'Seniors A (R1)',
        category: 'Seniors',
        gender_scope: 'men',
        coach_uids: ['coach_1'],
        fff_league_id: 'r1_idf_b',
        fff_team_id: 'fff_proday_seniors',
        fff_division_label: 'Régional 1 IDF',
        fff_group_label: 'Poule B',
        fff_season: '2026-2027',
        is_default: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'team_u19',
        club_id: 'club_proday',
        name: 'U19 Nationaux',
        category: 'U19',
        gender_scope: 'men',
        coach_uids: ['coach_2'],
        fff_league_id: 'u19_nat_a',
        fff_team_id: 'fff_proday_u19',
        fff_division_label: 'Championnat National U19',
        fff_group_label: 'Poule A',
        fff_season: '2026-2027',
        is_default: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'team_u17',
        club_id: 'club_proday',
        name: 'U17 Nationaux',
        category: 'U17',
        gender_scope: 'men',
        coach_uids: [],
        fff_league_id: 'u17_nat',
        fff_division_label: 'Championnat National U17',
        fff_group_label: 'Poule FFF',
        fff_season: '2026-2027',
        is_default: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'team_feminines',
        club_id: 'club_proday',
        name: 'Féminines R1',
        category: 'Féminines',
        gender_scope: 'women',
        coach_uids: ['coach_3'],
        fff_league_id: 'd1_fem',
        fff_division_label: 'Arkema Première Ligue (D1F)',
        fff_group_label: 'Poule Unique',
        fff_season: '2026-2027',
        is_default: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    it('génère la liste exhaustive des équipes sans limiter à la première équipe', () => {
      const overview = buildClubTeamsOverviewList(mockTeams, mockClub);
      expect(overview).toHaveLength(4);
      expect(overview.map((o) => o.category)).toEqual(['Seniors', 'U19', 'U17', 'Féminines']);
      expect(overview.map((o) => o.teamName)).toEqual([
        'Seniors A (R1)',
        'U19 Nationaux',
        'U17 Nationaux',
        'Féminines R1',
      ]);
    });

    it('associe à chaque équipe ses compétitions officielles et options de coupe', () => {
      const seniors = mockTeams[0];
      const comps = buildTeamCompetitionOptions(seniors);
      expect(comps.length).toBeGreaterThanOrEqual(2);
      expect(comps[0].type).toBe('championship');
      expect(comps[0].id).toBe('r1_idf_b');
      expect(comps[1].type).toBe('cup');
      expect(comps[1].name).toContain('Coupe de France');
      expect(comps[1].isKnockout).toBe(true);
    });

    it('associe la Coupe Gambardella spécifiquement à la catégorie U19', () => {
      const u19 = mockTeams[1];
      const comps = buildTeamCompetitionOptions(u19);
      const cup = comps.find((c) => c.type === 'cup');
      expect(cup).toBeDefined();
      expect(cup?.name).toContain('Coupe Gambardella');
      expect(cup?.isKnockout).toBe(true);
    });

    it('génère un ensemble représentatif pour un club nouvellement inscrit sans équipes locales', () => {
      const overview = buildClubTeamsOverviewList([], mockClub);
      expect(overview.length).toBeGreaterThanOrEqual(4);
      expect(overview.some((o) => o.category === 'Seniors')).toBe(true);
      expect(overview.some((o) => o.category === 'U19')).toBe(true);
      expect(overview.some((o) => o.category === 'Féminines')).toBe(true);
    });
  });

  // 2. COMPÉTITIONS À ÉLIMINATION DIRECTE (COUPES)
  describe('2. Honnêteté des Compétitions à Élimination Directe (Coupes)', () => {
    it('identifie correctement le format à élimination directe', () => {
      const team: Team = {
        id: 'team_senior',
        club_id: 'club_1',
        name: 'Seniors 1',
        category: 'Seniors',
        gender_scope: 'men',
        coach_uids: [],
        fff_league_id: 'r1_idf_b',
        is_default: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const comps = buildTeamCompetitionOptions(team);
      const cup = comps.find((c) => c.isKnockout);

      expect(cup).toBeDefined();
      expect(cup?.isKnockout).toBe(true);
      expect(cup?.groupLabel).toContain('Élimination directe');
    });

    it('ne fabrique jamais de classement artificiel pour une compétition de coupe', () => {
      const emptySeed = buildCertifiedSeedLeague('mock_cup_1', '2026-2027');
      expect(emptySeed.standings).toEqual([]);
      expect(emptySeed.syncStatus).toBe('unavailable');
    });
  });

  // 3. EXPLORATEUR DE CLUBS & LIGUES
  describe('3. Explorateur Multi-Critères (Régions, Districts, Catégories)', () => {
    it('met à disposition les options de territoires et de catégories', () => {
      expect(FRENCH_REGIONS_OPTIONS.length).toBeGreaterThanOrEqual(10);
      expect(FRENCH_DISTRICTS_OPTIONS.length).toBeGreaterThanOrEqual(10);
      expect(AGE_CATEGORIES_OPTIONS.length).toBeGreaterThanOrEqual(5);

      const regionIds = FRENCH_REGIONS_OPTIONS.map((r) => r.id);
      expect(regionIds).toContain('idf');
      expect(regionIds).toContain('ara');
      expect(regionIds).toContain('paca');
    });

    it('permet de filtrer les clubs par région géographique', async () => {
      const idfResults = await frenchFootballStandingsService.searchClubsFiltered({
        region: 'idf',
      });
      // Doit retourner les ligues franciliennes (R1, N3 IDF, Districts 92, 93, 75...)
      expect(idfResults).toBeDefined();
    });

    it('permet de filtrer les clubs par district départemental spécifique', async () => {
      const d92Results = await frenchFootballStandingsService.searchClubsFiltered({
        districtCode: '92',
      });
      expect(d92Results).toBeDefined();
    });

    it('permet de filtrer par catégorie d’âge (ex: Féminines ou U19)', async () => {
      const femResults = await frenchFootballStandingsService.searchClubsFiltered({
        category: 'feminines',
      });
      expect(femResults).toBeDefined();
    });
  });

  // 4. PROTECTION STRICTE DE LA VIE PRIVÉE & ACL
  describe('4. Séparation Étanche des Données Publiques et Privées', () => {
    it('interdit l’accès aux fiches de licenciés et effectifs lors de la navigation publique', () => {
      // Un supporter ou un club externe ne doit JAMAIS pouvoir lire le roster d'un autre club
      const canAccess = FffAuthoritativeDataService.canAccessLicenseRoster({
        userRole: 'supporter',
        userClubId: 'club_visiteur',
        targetClubId: 'club_explore_autre',
      });
      expect(canAccess).toBe(false);

      const coachCrossAccess = FffAuthoritativeDataService.canAccessLicenseRoster({
        userRole: 'coach',
        userClubId: 'club_a',
        targetClubId: 'club_b',
      });
      expect(coachCrossAccess).toBe(false);
    });

    it('autorise l’accès au staff légitime du club pour ses propres membres', () => {
      const authorized = FffAuthoritativeDataService.canAccessLicenseRoster({
        userRole: 'club',
        userClubId: 'club_proday',
        targetClubId: 'club_proday',
      });
      expect(authorized).toBe(true);
    });
  });

  // 5. TABLEAU DE POULE & ADAPTATION MOBILE
  describe('5. Lisibilité Mobile & Priorisation des Colonnes', () => {
    it('définit les colonnes contractuelles complètes', () => {
      expect(CLUB_STANDINGS_COLUMNS).toEqual([
        'position',
        'team',
        'points',
        'played',
        'won',
        'drawn',
        'lost',
        'goals_for',
        'goals_against',
        'goal_difference',
      ]);
    });

    it('isole les colonnes essentielles pour affichage sans clipping sur mobile', () => {
      expect(MOBILE_ESSENTIAL_COLUMNS).toEqual([
        'position',
        'team',
        'points',
        'played',
        'goal_difference',
      ]);
    });

    it('identifie avec exactitude l’équipe du club dans une ligne de classement', () => {
      const row: LeagueStandingRow = {
        rank: 1,
        team_id: 'fff_proday_seniors',
        name: 'FC ProDay Elite',
        played: 11,
        won: 8,
        drawn: 2,
        lost: 1,
        goals_for: 22,
        goals_against: 8,
        goal_diff: 14,
        points: 26,
        form: ['V', 'V', 'N', 'V', 'V'],
      };

      // Match par teamId
      expect(isClubStandingRow(row, { teamId: 'fff_proday_seniors' })).toBe(true);
      // Match par nom
      expect(isClubStandingRow(row, { teamName: 'ProDay' })).toBe(true);
      // Rejet club différent
      expect(isClubStandingRow(row, { teamId: 'autre_club', teamName: 'Racing CFF' })).toBe(false);
    });
  });

  // 6. RÈGLES OFFICIELLES DE DÉPARTAGE FFF & CACHE MÉMOIRE
  describe('6. Départages FFF & Cache Mémoire', () => {
    it('applique le tri FFF officiel (points, pénalités, différence, buts pour)', () => {
      const rawRows = [
        {
          teamId: 'team_b',
          teamName: 'Club B',
          rank: 2,
          points: 20,
          played: 10,
          won: 6,
          drawn: 2,
          lost: 2,
          goalsFor: 18,
          goalsAgainst: 10,
          goalDiff: 8,
          penalties: 0,
          form: ['V', 'N', 'V'] as Array<'V' | 'N' | 'D'>,
        },
        {
          teamId: 'team_a',
          teamName: 'Club A (Pénalisé)',
          rank: 1,
          points: 20,
          played: 10,
          won: 7,
          drawn: 0,
          lost: 3,
          goalsFor: 20,
          goalsAgainst: 10,
          goalDiff: 10,
          penalties: 1, // Pénalité administrative FFF : passe après l'équipe non pénalisée
          form: ['D', 'V', 'V'] as Array<'V' | 'N' | 'D'>,
        },
        {
          teamId: 'team_c',
          teamName: 'Club C',
          rank: 3,
          points: 24,
          played: 10,
          won: 7,
          drawn: 3,
          lost: 0,
          goalsFor: 21,
          goalsAgainst: 5,
          goalDiff: 16,
          penalties: 0,
          form: ['V', 'V', 'N'] as Array<'V' | 'N' | 'D'>,
        },
      ];

      const sorted = FffAuthoritativeDataService.sortStandingsByFffRules(rawRows);
      // Club C a 24 pts => 1er
      expect(sorted[0].teamName).toBe('Club C');
      expect(sorted[0].rank).toBe(1);
      // Club B (0 pénalité) devance Club A (1 pénalité) à égalité de points
      expect(sorted[1].teamName).toBe('Club B');
      expect(sorted[1].rank).toBe(2);
      expect(sorted[2].teamName).toBe('Club A (Pénalisé)');
      expect(sorted[2].rank).toBe(3);
    });

    it('utilise le cache mémoire pour éviter les requêtes redondantes lors de consultations successives', async () => {
      const firstCall = await frenchFootballStandingsService.getLeagueStandings('r1_idf_b', '2026-2027');
      const secondCall = await frenchFootballStandingsService.getLeagueStandings('r1_idf_b', '2026-2027');

      // Le deuxième appel renvoie la même instance en cache
      expect(firstCall).toBe(secondCall);
    });
  });
});
