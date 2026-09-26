/**
 * PRODAY — Suite de Tests d'Exactitude Sportive & Rapprochement FFF
 * 
 * Vérifie rigoureusement selon les exigences contractuelles :
 * 1. Identification multi-équipes au sein d'un même club (Équipe première vs Réserves 2/3 vs Vétérans).
 * 2. Discrimination stricte entre équipe première et équipes réserves (ex: VGA St-Maur vs VGA St-Maur 2).
 * 3. Concordance des catégories d'âge (Seniors vs Vétérans vs U17 vs U19).
 * 4. Concordance des genres (Masculin vs Féminin).
 * 5. Gestion des compétitions multi-poules (Poule A vs Poule B).
 * 6. Concordance de saison (Saison active vs saison antérieure).
 * 7. Préservation stricte des positions officielles publiées (ne jamais recalculer par simple tri de points).
 * 8. Traçabilité complète (URL officielle de publication, phase, groupe, horodatage).
 * 9. Gestion honnête des équipes non encore vérifiées (DATA-01 : zéro fausse donnée).
 */

import {
  standingsVerificationService,
  extractTeamDesignation,
  matchesTeamDesignation,
  matchTeamInStandings,
  checkSportingCompatibility,
  validateStandingsTable,
  resolveTeamCompetition,
  buildUnverifiedLeagueData,
} from '../services/standingsVerification.service';
import {
  isClubStandingRow,
  buildTeamCompetitionOptions,
  buildClubTeamsOverviewList,
} from '../features/club/ui/clubStandingsModel';
import {
  frenchFootballStandingsService,
  buildCertifiedSeedLeague,
  type FrenchLeagueData,
} from '../services/frenchFootballStandings.service';
import {
  D2_D94_B_ROWS,
  getOfficialSnapshot,
} from '../services/data/fffOfficialStandingsStore';
import type { Team } from '../models/Team';
import type { Club } from '../models/Club';
import type { LeagueStandingRow } from '../components/matchs/EliteLeagueStandings';

describe('Exactitude des Classements FFF & Rapprochement Équipe-Compétition', () => {
  beforeEach(() => {
    frenchFootballStandingsService.clearMemoryCache();
  });

  // --------------------------------------------------------------------------
  // 1. RAPPROCHEMENT AU SEIN D'UN CLUB MULTI-ÉQUIPES (ex: US Ormesson Football)
  // --------------------------------------------------------------------------
  describe('1. Club Multi-Équipes & Attribution des Compétitions', () => {
    const ormessonClub: Club = {
      id: 'us_ormesson_football',
      name: 'US Ormesson Football',
      fff_affiliation_number: '510193',
      fff_league_id: 'd2_d94_b',
      fff_division_label: 'Départemental 2 · Poule B',
      fff_group_label: 'Poule B',
      fff_district_code: '94',
      created_at: new Date(),
      updated_at: new Date(),
    } as Club;

    const ormessonSeniors1: Team = {
      id: 'us_ormesson_seniors_1',
      club_id: 'us_ormesson_football',
      name: 'US Ormesson 1',
      category: 'Seniors',
      gender_scope: 'men',
      fff_league_id: 'd2_d94_b',
      fff_team_id: 'us_ormesson_football',
      fff_division_label: 'Départemental 2 · Poule B',
      fff_group_label: 'Poule B',
      fff_season: '2026-2027',
      fff_district_code: '94',
      is_default: true,
      coach_uids: ['coach_ormesson_1'],
      created_at: new Date(),
      updated_at: new Date(),
    };

    const ormessonSeniors2: Team = {
      id: 'us_ormesson_seniors_2',
      club_id: 'us_ormesson_football',
      name: 'US Ormesson 2 (Réserve)',
      category: 'Seniors',
      gender_scope: 'men',
      fff_league_id: 'd3_d94_c',
      fff_team_id: 'us_ormesson_football_2',
      fff_division_label: 'Départemental 3 · Poule C',
      fff_group_label: 'Poule C',
      fff_season: '2026-2027',
      fff_district_code: '94',
      is_default: false,
      coach_uids: ['coach_ormesson_2'],
      created_at: new Date(),
      updated_at: new Date(),
    };

    const ormessonVeterans: Team = {
      id: 'us_ormesson_anciens',
      club_id: 'us_ormesson_football',
      name: 'Vétérans Anciens',
      category: 'Vétérans',
      gender_scope: 'men',
      fff_league_id: undefined, // Pas encore homologué / relié
      fff_season: '2026-2027',
      is_default: false,
      coach_uids: ['coach_veterans'],
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('résout avec précision les attributs officiels de chaque équipe sans les mélanger', () => {
      const resS1 = resolveTeamCompetition(ormessonSeniors1, ormessonClub);
      expect(resS1.verificationStatus).toBe('verified');
      expect(resS1.leagueId).toBe('d2_d94_b');
      expect(resS1.divisionLabel).toBe('Départemental 2 · Poule B');
      expect(resS1.designation).toBe('1');
      expect(resS1.fffAffiliationNumber).toBe('510193');

      const resS2 = resolveTeamCompetition(ormessonSeniors2, ormessonClub);
      expect(resS2.verificationStatus).toBe('verified');
      expect(resS2.leagueId).toBe('d3_d94_c');
      expect(resS2.designation).toBe('2');

      const resVet = resolveTeamCompetition(ormessonVeterans, ormessonClub);
      expect(resVet.verificationStatus).toBe('unverified');
      expect(resVet.leagueId).toBeNull();
      expect(resVet.verificationReason).toContain("Aucune compétition officielle FFF homologuée n'a été rattachée");
    });

    it('ne force jamais l\'équipe réserve ou vétérans sur la compétition de l\'équipe 1', () => {
      const overview = buildClubTeamsOverviewList([ormessonSeniors1, ormessonSeniors2, ormessonVeterans], ormessonClub);
      expect(overview).toHaveLength(3);

      const s1Item = overview.find((t) => t.id === 'us_ormesson_seniors_1');
      const s2Item = overview.find((t) => t.id === 'us_ormesson_seniors_2');
      const vetItem = overview.find((t) => t.id === 'us_ormesson_anciens');

      expect(s1Item?.competitions[0].id).toBe('d2_d94_b');
      expect(s2Item?.competitions[0].id).toBe('d3_d94_c');
      // Pour les Vétérans non reliés, aucune ligue arbitraire R1 IDF n'est injectée
      expect(vetItem?.competitions[0].id).toBe('unverified_us_ormesson_anciens');
      expect(vetItem?.competitions[0].name).toBe('Classement non encore vérifié');
    });
  });

  // --------------------------------------------------------------------------
  // 2. DISCRIMINATION ÉQUIPE PREMIÈRE vs RÉSERVES (2 & 3)
  // --------------------------------------------------------------------------
  describe('2. Discrimination Stricte Équipe Première vs Équipe Réserve', () => {
    const pouleBRows: LeagueStandingRow[] = [
      { rank: 1, team_id: 'marolles_fc', name: 'Marolles FC', played: 3, won: 3, drawn: 0, lost: 0, goals_for: 8, goals_against: 2, goal_diff: 6, points: 9, form: ['V', 'V', 'V'], isMyTeam: false },
      { rank: 3, team_id: 'fc_caudacienne_2', name: 'FC Caudacienne 2', played: 3, won: 2, drawn: 0, lost: 1, goals_for: 6, goals_against: 4, goal_diff: 2, points: 6, form: ['V', 'D', 'V'], isMyTeam: false },
      { rank: 5, team_id: 'us_ormesson_football', name: 'US Ormesson Football', played: 3, won: 1, drawn: 1, lost: 1, goals_for: 4, goals_against: 4, goal_diff: 0, points: 4, form: ['N', 'V', 'D'], isMyTeam: false },
      { rank: 6, team_id: 'vga_st_maur_2', name: 'VGA St-Maur 2', played: 3, won: 1, drawn: 1, lost: 1, goals_for: 4, goals_against: 4, goal_diff: 0, points: 4, form: ['V', 'N', 'D'], isMyTeam: false },
      { rank: 10, team_id: 'ca_vitry_3', name: 'CA Vitry 3', played: 3, won: 0, drawn: 1, lost: 2, goals_for: 2, goals_against: 5, goal_diff: -3, points: 1, form: ['D', 'N', 'D'], isMyTeam: false },
    ];

    it('extrait correctement la désignation de l\'équipe', () => {
      expect(extractTeamDesignation('US Ormesson 1').designation).toBe('1');
      expect(extractTeamDesignation('US Ormesson Football').designation).toBe('1');
      expect(extractTeamDesignation('FC Caudacienne 2').designation).toBe('2');
      expect(extractTeamDesignation('VGA St-Maur B').designation).toBe('2');
      expect(extractTeamDesignation('Seniors 2').designation).toBe('2');
      expect(extractTeamDesignation('CA Vitry 3').designation).toBe('3');
      expect(extractTeamDesignation('Équipe 3').designation).toBe('3');
    });

    it('empêche une équipe 1 de matcher avec une réserve 2 d\'un même club', () => {
      // Si l'utilisateur regarde VGA St-Maur 1
      const matchForTeam1 = matchTeamInStandings(pouleBRows, {
        teamName: 'VGA St-Maur',
        clubName: 'VGA St-Maur',
        designation: '1',
      });
      // VGA St-Maur 2 ne doit PAS être sélectionnée comme étant l'équipe 1 !
      expect(matchForTeam1).toBeNull();
    });

    it('permet à une équipe réserve 2 de matcher précisément avec sa ligne 2', () => {
      const matchForTeam2 = matchTeamInStandings(pouleBRows, {
        teamName: 'VGA Saint-Maur 2',
        clubName: 'VGA St-Maur',
        designation: '2',
      });
      expect(matchForTeam2).not.toBeNull();
      expect(matchForTeam2?.name).toBe('VGA St-Maur 2');
      expect(matchForTeam2?.rank).toBe(6);
    });

    it('rejette la correspondance si une équipe 1 vérifie isClubStandingRow face à une réserve', () => {
      const rowVgaReserve = pouleBRows.find((r) => r.name === 'VGA St-Maur 2')!;
      // Recherche avec nom d'équipe 1
      const matches = isClubStandingRow(rowVgaReserve, {
        teamName: 'VGA St-Maur 1',
        clubName: 'VGA St-Maur',
      });
      expect(matches).toBe(false);
    });

    it('accepte la correspondance si la désignation correspond', () => {
      const rowOrmesson = pouleBRows.find((r) => r.name === 'US Ormesson Football')!;
      const matches = isClubStandingRow(rowOrmesson, {
        teamName: 'US Ormesson 1',
        clubName: 'US Ormesson Football',
      });
      expect(matches).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 3. CONCORDANCE DES CATÉGORIES D'ÂGE & DE GENRE
  // --------------------------------------------------------------------------
  describe('3. Concordance Sportive (Genre & Catégorie)', () => {
    it('détecte l\'incompatibilité entre une équipe Féminine et un championnat Masculin', () => {
      const compat = checkSportingCompatibility(
        'Seniors',
        'women',
        'Régional 1 Île-de-France · Poule B',
        'Régional 1 IDF',
      );
      expect(compat.compatible).toBe(false);
      expect(compat.reason).toContain('Incompatibilité de genre');
    });

    it('valide la compatibilité pour une équipe Féminine dans une ligue féminine', () => {
      const compat = checkSportingCompatibility(
        'Féminines',
        'women',
        'Arkema Première Ligue (D1 Féminine)',
        'D1 Féminine',
      );
      expect(compat.compatible).toBe(true);
    });

    it('détecte l\'incompatibilité entre une équipe Vétérans et une ligue Seniors', () => {
      const compat = checkSportingCompatibility(
        'Vétérans',
        'men',
        'Régional 2 Île-de-France · Poule B',
        'Régional 2 IDF',
      );
      expect(compat.compatible).toBe(false);
      expect(compat.reason).toContain('Incompatibilité de catégorie');
    });

    it('détecte l\'incompatibilité entre une équipe U17 et un championnat U19 ou Seniors', () => {
      const compat = checkSportingCompatibility(
        'U17',
        'men',
        'Championnat National U19 · Poule A',
        'National U19',
      );
      expect(compat.compatible).toBe(false);
      expect(compat.reason).toContain('Incompatibilité de catégorie : L\'équipe est U17');
    });
  });

  // --------------------------------------------------------------------------
  // 4. VALIDATION FORMELLE DU TABLEAU DE CLASSEMENT (7 RÈGLES)
  // --------------------------------------------------------------------------
  describe('4. Validation Formelle d\'Intégrité du Tableau (7 Règles)', () => {
    const verifiedSnapshot = getOfficialSnapshot('d2_d94_b', '2026-2027')!;

    it('valide avec succès le tableau officiel de D2 Poule B pour US Ormesson 1', () => {
      const validation = validateStandingsTable(verifiedSnapshot, {
        teamName: 'US Ormesson 1',
        clubName: 'US Ormesson Football',
        category: 'Seniors',
        genderScope: 'men',
        season: '2026-2027',
      });

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.matchedRow).not.toBeNull();
      expect(validation.matchedRow?.name).toBe('US Ormesson Football');
      expect(validation.matchedRow?.rank).toBe(5);
      expect(validation.matchedRow?.points).toBe(4);
    });

    it('rejette un tableau si la saison ne correspond pas', () => {
      const validation = validateStandingsTable(verifiedSnapshot, {
        teamName: 'US Ormesson 1',
        clubName: 'US Ormesson Football',
        category: 'Seniors',
        genderScope: 'men',
        season: '2025-2026', // Saison antérieure divergente
      });

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.includes('Divergence de saison'))).toBe(true);
    });

    it('rejette un tableau si les rangs officiels ne sont pas croissants ou invalides', () => {
      const corruptedTable: FrenchLeagueData = {
        ...verifiedSnapshot,
        standings: [
          { ...verifiedSnapshot.standings[0], rank: 3 },
          { ...verifiedSnapshot.standings[1], rank: 1 }, // Décroissance anormale
        ],
      };

      const validation = validateStandingsTable(corruptedTable, {
        teamName: 'Marolles FC',
        season: '2026-2027',
      });

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.includes('positions officielles ne sont pas monotones'))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 5. PRÉSERVATION DES POSITIONS OFFICIELLES PUBLIÉES (RÈGLE CRITIQUE)
  // --------------------------------------------------------------------------
  describe('5. Préservation Stricte des Positions Publiées FFF', () => {
    it('ne modifie jamais l\'ordre officiel des 12 clubs de Poule B', () => {
      const snap = getOfficialSnapshot('d2_d94_b', '2026-2027')!;
      expect(snap.standings).toHaveLength(12);

      // Ordre publié officiel
      expect(snap.standings[0].name).toBe('Marolles FC');
      expect(snap.standings[0].rank).toBe(1);

      expect(snap.standings[1].name).toBe('CSA Kremlin-Bicêtre');
      expect(snap.standings[1].rank).toBe(2);

      expect(snap.standings[4].name).toBe('US Ormesson Football');
      expect(snap.standings[4].rank).toBe(5);

      expect(snap.standings[11].name).toBe('Valenton Football Academy');
      expect(snap.standings[11].rank).toBe(12);
    });

    it('conserve les positions même en présence d\'ex-aequo au nombre de points', () => {
      // Dans Poule B : FC Caudacienne 2 (6 pts, diff +2) et L'Haÿ-les-Roses CA (6 pts, diff +2)
      // L'ordre publié FFF doit être respecté sans être permuté arbitrairement
      const snap = getOfficialSnapshot('d2_d94_b', '2026-2027')!;
      const caudacienne = snap.standings.find((r) => r.name.includes('Caudacienne'))!;
      const lhay = snap.standings.find((r) => r.name.includes('Haÿ-les-Roses'))!;

      expect(caudacienne.points).toBe(lhay.points);
      expect(caudacienne.rank).toBe(3);
      expect(lhay.rank).toBe(4);
    });
  });

  // --------------------------------------------------------------------------
  // 6. TRAÇABILITÉ DES SOURCES & HORODATAGE
  // --------------------------------------------------------------------------
  describe('6. Traçabilité des Données Officielles', () => {
    it('associe l\'URL officielle FFF exacte et les métadonnées de phase et poule', () => {
      const snap = getOfficialSnapshot('d2_d94_b', '2026-2027')!;
      expect(snap.sourceUrl).toBe('https://districtvaldemarne.fff.fr/competitions/?id=410650&poule=2&phase=1');
      expect(snap.groupLabel).toBe('Poule B');
      expect(snap.phase).toBe('Phase 1');
      expect(snap.verificationStatus).toBe('verified');
      expect(snap.lastSyncAt).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 7. ÉQUIPES NON ENCORE VÉRIFIÉES (DATA-01)
  // --------------------------------------------------------------------------
  describe('7. Gestion Honnête des Équipes Non Encore Vérifiées (DATA-01)', () => {
    it('génère une structure vide avec motif explicite sans inventer de classement', () => {
      const unverified = buildUnverifiedLeagueData(
        'unverified_custom_team',
        'Classement non encore vérifié',
        'Aucune poule homologuée FFF n\'a été rattachée.',
      );

      expect(unverified.standings).toEqual([]);
      expect(unverified.scorers).toEqual([]);
      expect(unverified.source).toBe('unverified');
      expect(unverified.syncStatus).toBe('unavailable');
      expect(unverified.lastError).toContain('Aucune poule homologuée');
    });

    it('ne renvoie jamais de fausses données de démo pour un identifiant inconnu', () => {
      const emptySeed = buildCertifiedSeedLeague('unknown_league_id', '2026-2027');
      expect(emptySeed.standings).toEqual([]);
      expect(emptySeed.officialFffCertified).toBe(false);
      expect(emptySeed.syncStatus).toBe('unavailable');
    });
  });
});
