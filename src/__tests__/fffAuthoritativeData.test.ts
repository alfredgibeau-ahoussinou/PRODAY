import { FootclubsLicenseAdapter } from '../services/adapters/FootclubsLicenseAdapter';
import { NationalSportsApiAdapter } from '../services/adapters/NationalSportsApiAdapter';
import { FffDofaAdapter } from '../services/adapters/FffDofaAdapter';
import { SidelineMatchScoreAdapter } from '../services/adapters/SidelineMatchScoreAdapter';
import { FffAuthoritativeDataService } from '../services/fffAuthoritativeData.service';
import { resolveLiveState, estimateLiveMinute, formatMatchScoreSourceLabel } from '../utils/matchLive';
import type { TeamEvent } from '../models/TeamEvent';

describe('FFF Authoritative Data Integration Loop', () => {
  // --------------------------------------------------------------------------
  // 1. Standings & Official FFF Tie-Breaking Rules
  // --------------------------------------------------------------------------
  describe('1. Standings & FFF Rules', () => {
    it('applies official Fff tie-breaking rules (points, goal diff, goals for, penalties)', () => {
      const rawRows = [
        {
          rank: 1,
          teamId: 'team_b',
          teamName: 'B Team',
          played: 10,
          won: 6,
          drawn: 2,
          lost: 2,
          goalsFor: 18,
          goalsAgainst: 10,
          goalDiff: 8,
          points: 20,
          penalties: 0,
          form: ['V', 'V', 'N', 'V', 'D'] as Array<'V' | 'N' | 'D'>,
        },
        {
          rank: 2,
          teamId: 'team_a',
          teamName: 'A Team',
          played: 10,
          won: 6,
          drawn: 2,
          lost: 2,
          goalsFor: 22,
          goalsAgainst: 12,
          goalDiff: 10, // Better goal diff
          points: 20,
          penalties: 0,
          form: ['V', 'V', 'V', 'N', 'D'] as Array<'V' | 'N' | 'D'>,
        },
        {
          rank: 3,
          teamId: 'team_c_penalized',
          teamName: 'C Team',
          played: 10,
          won: 7,
          drawn: 0,
          lost: 3,
          goalsFor: 20,
          goalsAgainst: 10,
          goalDiff: 10,
          points: 20,
          penalties: 1, // Has 1 penalty point deducted administratively
          form: ['V', 'D', 'V', 'V', 'D'] as Array<'V' | 'N' | 'D'>,
        },
      ];

      const sorted = FffAuthoritativeDataService.sortStandingsByFffRules(rawRows);

      // Team A has +10 goal diff, 0 penalties -> 1st
      expect(sorted[0].teamName).toBe('A Team');
      expect(sorted[0].rank).toBe(1);

      // Team B has +8 goal diff, 0 penalties -> 2nd
      expect(sorted[1].teamName).toBe('B Team');
      expect(sorted[1].rank).toBe(2);

      // Team C has +10 goal diff but 1 penalty point -> 3rd
      expect(sorted[2].teamName).toBe('C Team');
      expect(sorted[2].rank).toBe(3);
    });

    it('parses DOFA standings response with administrative penalties and forfeits', () => {
      const dofaPayload = {
        'hydra:member': [
          {
            clgRang: 1,
            clgNomEquipe: 'US Ormesson',
            clgNbJournees: 14,
            clgTotalPoints: 34,
            clgNbGagnes: 11,
            clgNbNuls: 1,
            clgNbPerdus: 2,
            clgNbButsPour: 32,
            clgNbButsContre: 14,
            clgDiff: 18,
            clgPenalite: 0,
            clgForfait: 0,
            clgForme: 'V,V,V,N,V',
            equipe: { clNo: '112233', clgNomEquipe: 'US Ormesson' },
          },
          {
            clgRang: 2,
            clgNomEquipe: 'Vincennes CO',
            clgNbJournees: 14,
            clgTotalPoints: 28,
            clgNbGagnes: 9,
            clgNbNuls: 2,
            clgNbPerdus: 3,
            clgNbButsPour: 25,
            clgNbButsContre: 15,
            clgDiff: 10,
            clgPenalite: 1, // 1 point de pénalité FFF
            clgForfait: 0,
            clgForme: 'D,V,V,V,N',
            equipe: { clNo: '445566', clgNomEquipe: 'Vincennes CO' },
          },
        ],
      };

      const parsed = FffDofaAdapter.parseStandingsResponse(
        {
          prodayId: 'd1_d94',
          dofaCompetId: '425640',
          name: 'Départemental 1 · District 94',
          category: 'district',
          region: 'Île-de-France',
          districtCode: '94',
          divisionLabel: 'District Val-de-Marne D1',
        },
        dofaPayload,
        '2026-2027',
      );

      expect(parsed).not.toBeNull();
      expect(parsed?.standings.length).toBe(2);
      expect(parsed?.standings[0].teamName).toBe('US Ormesson');
      expect(parsed?.standings[0].points).toBe(34);
      expect(parsed?.standings[1].teamName).toBe('Vincennes CO');
      expect(parsed?.standings[1].penalties).toBe(1);
      expect(parsed?.provenance.source).toBe('fff_dofa_live');
      expect(parsed?.provenance.syncHealth).toBe('ok');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Disambiguation of Teams with Similar Names
  // --------------------------------------------------------------------------
  describe('2. Team Disambiguation', () => {
    it('correctly disambiguates teams with similar names using affiliation numbers', () => {
      const teams = [
        { id: 'team_1', name: 'Montrouge FC 92', clubCode: '540123' },
        { id: 'team_2', name: 'Montrouge FC 92 2', clubCode: '540123' },
        { id: 'team_3', name: 'Montrouge ES', clubCode: '500456' },
      ];

      const disambiguated = FffAuthoritativeDataService.disambiguateTeams(teams);

      expect(disambiguated.get('team_1')).toBe('code_540123');
      expect(disambiguated.get('team_2')).toBe('code_540123');
      expect(disambiguated.get('team_3')).toBe('code_500456');
      expect(disambiguated.get('team_1')).not.toBe(disambiguated.get('team_3'));
    });
  });

  // --------------------------------------------------------------------------
  // 3. Fixtures, Results & Subsequent Corrections
  // --------------------------------------------------------------------------
  describe('3. Fixtures & Results', () => {
    it('parses national fixtures with status: completed, postponed, ongoing', () => {
      const apiPayload = {
        response: [
          {
            fixture: {
              id: 9901,
              date: '2026-09-20T20:00:00+02:00',
              status: { short: 'FT' },
              venue: { name: 'Stade Charléty', city: 'Paris' },
            },
            league: { round: 'Journée 5' },
            teams: {
              home: { id: 101, name: 'Paris FC' },
              away: { id: 102, name: 'Red Star FC' },
            },
            goals: { home: 2, away: 1 },
          },
          {
            fixture: {
              id: 9902,
              date: '2026-09-27T18:00:00+02:00',
              status: { short: 'PST' }, // Reporté
              venue: { name: 'Stade de la Rabine', city: 'Vannes' },
            },
            league: { round: 'Journée 6' },
            teams: {
              home: { id: 103, name: 'Vannes OC' },
              away: { id: 104, name: 'US Concarneau' },
            },
            goals: { home: null, away: null },
          },
        ],
      };

      const fixtures = NationalSportsApiAdapter.parseFixturesResponse(
        'national1',
        apiPayload,
        '2026-2027',
      );

      expect(fixtures.length).toBe(2);

      // Match 1: Validé terminé
      expect(fixtures[0].id).toBe('9901');
      expect(fixtures[0].status).toBe('completed');
      expect(fixtures[0].homeScore).toBe(2);
      expect(fixtures[0].awayScore).toBe(1);
      expect(fixtures[0].isResultConfirmed).toBe(true);

      // Match 2: Reporté (PST)
      expect(fixtures[1].id).toBe('9902');
      expect(fixtures[1].status).toBe('postponed');
      expect(fixtures[1].isResultConfirmed).toBe(false);
      expect(fixtures[1].homeScore).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // 4. Footclubs Licensed-Player Records: Duplicates, Renewals, Ambiguity
  // --------------------------------------------------------------------------
  describe('4. Footclubs License Records', () => {
    it('handles renewals, duplicate rows in file, and homonym ambiguities safely', () => {
      const csvData = [
        'Licence;Nom;Prenom;DateNaissance;Categorie;CertificatMedical;Email;Club',
        // Licencié 1: Renouvellement
        '1002345678;DUPONT;Thomas;2005-04-12;U20;Oui;thomas.dupont@test.com;US Ormesson (512345)',
        // Doublon strict de la même ligne dans le fichier CSV -> doit être dédupliqué sans erreur
        '1002345678;DUPONT;Thomas;2005-04-12;U20;Oui;thomas.dupont@test.com;US Ormesson (512345)',
        // Licencié 2: Mutation depuis un autre club
        '2009876543;TRAORE;Mamadou;2004-11-20;Seniors;Valide;mamadou@test.com;CSL Aulnay (500123)',
        // Licencié 3: Homonyme ambigu (même nom qu’un membre existant mais n° de licence différent)
        '9998887776;MARTIN;Lucas;2006-08-15;U19;1;lucas.m2@test.com;US Ormesson (512345)',
      ].join('\n');

      const existingMembers = [
        // Thomas Dupont est déjà connu avec sa licence -> Renouvellement
        {
          uid: 'user_dupont',
          displayName: 'Thomas DUPONT',
          licenseNumber: '1002345678',
          birthDate: '2005-04-12',
          email: 'thomas.dupont@test.com',
        },
        // Un Lucas Martin existait déjà avec un autre numéro de licence -> Ambiguïté détectée
        {
          uid: 'user_martin_old',
          displayName: 'Lucas MARTIN',
          licenseNumber: '1112223334',
          birthDate: '2006-08-15',
        },
      ];

      const result = FootclubsLicenseAdapter.parseAndNormalize(csvData, {
        clubAffiliationNumber: '512345',
        clubName: 'US Ormesson',
        season: '2026-2027',
        operatorUid: 'coach_sec_1',
        existingMembers,
      });

      expect(result.success).toBe(true);
      // Doublon dédupliqué: 3 enregistrements distincts retenus
      expect(result.records.length).toBe(3);
      expect(result.duplicatesCount).toBe(1);

      // Vérification 1: Renouvellement détecté pour Thomas Dupont
      const dupont = result.records.find((r) => r.licenseNumber === '1002345678');
      expect(dupont).toBeDefined();
      expect(dupont?.matchedUserUid).toBe('user_dupont');
      expect(dupont?.status).toBe('active_current_season');
      expect(dupont?.medicalCertificateValid).toBe(true);

      // Vérification 2: Mutation détectée pour Mamadou Traore
      const traore = result.records.find((r) => r.licenseNumber === '2009876543');
      expect(traore).toBeDefined();
      expect(traore?.status).toBe('transferred');

      // Vérification 3: Ambiguïté signalée pour Lucas Martin
      const martin = result.records.find((r) => r.licenseNumber === '9998887776');
      expect(martin).toBeDefined();
      expect(martin?.ambiguityFlag).toBe(true);
      expect(martin?.ambiguityReason).toContain('Homonymie');
      expect(result.ambiguitiesCount).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Source Outage & Stale Snapshot Preservation
  // --------------------------------------------------------------------------
  describe('5. Source Outage & Freshness Badge', () => {
    it('preserves valid snapshot when source fails and marks status as stale', () => {
      const existingSnapshot = {
        id: 'r1_idf_a',
        competitionName: 'Régional 1 IDF',
        season: '2026-2027',
        category: 'regional' as const,
        divisionLabel: 'R1 IDF Poule A',
        standings: [
          {
            rank: 1,
            teamId: 't1',
            teamName: 'CS Meaux',
            played: 8,
            won: 6,
            drawn: 1,
            lost: 1,
            goalsFor: 15,
            goalsAgainst: 6,
            goalDiff: 9,
            points: 19,
            form: ['V', 'V', 'V', 'N', 'V'] as Array<'V' | 'N' | 'D'>,
          },
        ],
        provenance: {
          source: 'fff_dofa_live' as const,
          sourceLabel: 'DOFA FFF',
          syncedAt: '2026-09-24T18:00:00Z',
          syncHealth: 'ok' as const,
        },
      };

      const preserved = FffDofaAdapter.preserveStaleStanding(
        existingSnapshot,
        'Akamai WAF HTTP 403 Forbidden sur api-dofa.fff.fr',
      );

      // Les données de classement restent intactes (jamais effacées !)
      expect(preserved.standings.length).toBe(1);
      expect(preserved.standings[0].teamName).toBe('CS Meaux');
      // La santé est dégradée en 'stale' avec le message d'erreur
      expect(preserved.provenance.syncHealth).toBe('stale');
      expect(preserved.provenance.lastError).toContain('Akamai WAF HTTP 403');

      // Le badge calcule un état honnête
      const badge = FffAuthoritativeDataService.computeFreshnessBadge(
        preserved.provenance.syncedAt,
        preserved.provenance.syncHealth,
        'FFF DOFA',
      );
      expect(badge.health).toBe('stale');
      expect(badge.label).toContain('DONNÉES ANCIENNES');
    });
  });

  // --------------------------------------------------------------------------
  // 6. Role & Club Access Control (Privacy & RGPD)
  // --------------------------------------------------------------------------
  describe('6. Access Control (ACL)', () => {
    it('denies access to player license roster across different clubs', () => {
      // Coach du Club A essayant d'accéder au Club B
      const unauthorized = FffAuthoritativeDataService.canAccessLicenseRoster({
        userRole: 'coach',
        userClubId: 'club_us_ormesson',
        targetClubId: 'club_creteil_lusitanos',
      });
      expect(unauthorized).toBe(false);

      // Dirigeant du Club B accédant à son propre club
      const authorizedClubStaff = FffAuthoritativeDataService.canAccessLicenseRoster({
        userRole: 'club',
        userClubId: 'club_creteil_lusitanos',
        targetClubId: 'club_creteil_lusitanos',
      });
      expect(authorizedClubStaff).toBe(true);

      // Joueur essayant d'accéder à la fiche d'un autre joueur
      const unauthorizedPlayer = FffAuthoritativeDataService.canAccessLicenseRoster({
        userRole: 'player',
        userClubId: 'club_creteil_lusitanos',
        targetClubId: 'club_creteil_lusitanos',
        currentUid: 'player_dupont',
        targetPlayerUid: 'player_martin',
      });
      expect(unauthorizedPlayer).toBe(false);

      // Joueur accédant à sa propre fiche
      const authorizedPlayerSelf = FffAuthoritativeDataService.canAccessLicenseRoster({
        userRole: 'player',
        userClubId: 'club_creteil_lusitanos',
        targetClubId: 'club_creteil_lusitanos',
        currentUid: 'player_dupont',
        targetPlayerUid: 'player_dupont',
      });
      expect(authorizedPlayerSelf).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Live Scores: Live Telemetry vs Sideline Manual Entry
  // --------------------------------------------------------------------------
  describe('7. Live Scores vs Sideline Entry', () => {
    it('parses real national live telemetry with running clock and events', () => {
      const liveJson = {
        response: [
          {
            fixture: { id: 7701, status: { short: '1H', elapsed: 34 } },
            teams: {
              home: { id: 50, name: 'Red Star FC' },
              away: { id: 51, name: 'AS Nancy Lorraine' },
            },
            goals: { home: 1, away: 0 },
            events: [
              {
                time: { elapsed: 22 },
                team: { id: 50 },
                player: { name: 'Damien Durand' },
                type: 'Goal',
                detail: 'Normal Goal',
              },
            ],
          },
        ],
      };

      const liveScore = NationalSportsApiAdapter.parseLiveScoreResponse(liveJson);

      expect(liveScore).not.toBeNull();
      expect(liveScore?.hasLiveTelemetry).toBe(true);
      expect(liveScore?.minute).toBe(34);
      expect(liveScore?.clockRunning).toBe(true);
      expect(liveScore?.homeScore).toBe(1);
      expect(liveScore?.events.length).toBe(1);
      expect(liveScore?.events[0].playerName).toBe('Damien Durand');
    });

    it('manages authentic sideline manual entry without inventing a match clock', () => {
      const initial = SidelineMatchScoreAdapter.initMatchScore({
        fixtureId: 'amateur_fixture_101',
        homeTeamName: 'US Ormesson U18',
        awayTeamName: 'Vincennes CO U18',
        operatorUid: 'coach_dupont',
      });

      // Match amateur : PAS de télémétrie satellitaire ni d'horloge simulée
      expect(initial.hasLiveTelemetry).toBe(false);
      expect(initial.minute).toBeUndefined();
      expect(initial.sourceType).toBe('club_official_entry');

      // Le coach enregistre un but au bord du terrain
      const updated = SidelineMatchScoreAdapter.recordSidelineEvent(
        initial,
        {
          type: 'goal',
          team: 'home',
          playerName: 'Lucas Martin',
          minute: 18, // Saisie par le coach s'il la renseigne, mais pas de timer en continu
        },
        'coach_dupont',
      );

      expect(updated.homeScore).toBe(1);
      expect(updated.awayScore).toBe(0);
      expect(updated.status).toBe('live');
      expect(updated.verifiedByUid).toBe('coach_dupont');
      expect(updated.events.length).toBe(1);

      // Libellé de source honnête
      const eventMock: TeamEvent = {
        id: 'amateur_fixture_101',
        title: 'Match U18',
        event_type: 'friendly',
        organizer_uid: 'coach_dupont',
        organizer_name: 'Coach Dupont',
        city: 'Ormesson',
        starts_at: new Date(Date.now() - 30 * 60 * 1000), // démarré il y a 30 min
        invitee_uids: [],
        rsvps: {},
        live_state: {
          status: 'live',
          home_score: 1,
          away_score: 0,
          verified_by_uid: 'coach_dupont',
          source_type: 'club_official_entry',
          has_live_telemetry: false, // Pas de télémétrie en continu
        },
        created_at: new Date(),
        updated_at: new Date(),
      };

      const resolved = resolveLiveState(eventMock);
      // N'anime JAMAIS un chronomètre inventé
      expect(estimateLiveMinute(eventMock)).toBeUndefined();
      expect(resolved.minute).toBeUndefined();

      const label = formatMatchScoreSourceLabel(resolved);
      expect(label).toBe('● SAISIE BANC DE TOUCHE CLUB');
    });
  });
});
