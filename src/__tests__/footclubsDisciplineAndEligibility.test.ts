// src/__tests__/footclubsDisciplineAndEligibility.test.ts
// Tests unitaires et d'intégration complets pour Footclubs FFF & le contrôle des suspensions

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  parseFootclubsDisciplineCsv,
  computeFffMondayEffectiveDate,
  parseFrenchOrIsoDate,
  deduceDisciplinaryScope,
  deduceSanctionType,
} from '../features/club/utils/footclubsDisciplineParser';
import { playerDisciplinaryService } from '../services/playerDisciplinary.service';
import type { User } from '../models/User';
import type { MatchEligibilityContext } from '../models/PlayerDisciplinary';

describe('Footclubs FFF Discipline & Player Suspension System', () => {
  const CLUB_ID = 'test_club_fff_75001';

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('1. Parsing des fichiers d’extraction CSV Footclubs', () => {
    it('parse correctement un fichier CSV Footclubs avec point-virgule et entêtes officiels', () => {
      const csv = `N° Licence;Nom;Prénom;Commission;N° Dossier;Date PV;Date Prise d'effet;Sanction;Compétition;Motif
2541890123;DUPONT;Lucas;Commission Régionale de Discipline;PV-2023-44;12/10/2023;16/10/2023;2 matchs;Championnat;Comportement antisportif
2549876543;MARTIN;Thomas;District 92 Discipline;PV-2023-18;15/10/2023;;1 match;Officiel;Deux cartons jaunes
2541122334;BENALIA;Karim;Ligue IDF;PV-2023-09;01/10/2023;02/10/2023;3 matchs;Toutes compétitions;Faute grossière`;

      const result = parseFootclubsDisciplineCsv(csv, CLUB_ID);

      expect(result.success).toBe(true);
      expect(result.records).toHaveLength(3);
      expect(result.errors).toHaveLength(0);

      const r1 = result.records[0];
      expect(r1.license_number).toBe('2541890123');
      expect(r1.player_name).toBe('DUPONT Lucas');
      expect(r1.commission_name).toBe('Commission Régionale de Discipline');
      expect(r1.pv_number).toBe('PV-2023-44');
      expect(r1.matches_total).toBe(2);
      expect(r1.scope).toBe('championship_only');
      expect(r1.status).toBe('active');
      expect(r1.effective_date).toBe('2023-10-16');

      // Pour MARTIN Thomas, la date d'effet n'était pas renseignée -> calculée automatiquement au lundi suivant FFF
      const r2 = result.records[1];
      expect(r2.effective_date).toBe('2023-10-16'); // 15/10/2023 était un dimanche -> lundi suivant = 16/10/2023
    });

    it('gère les délimiteurs virgule et les formats de dates ISO et français', () => {
      const csv = `Licence,Nom,Commission,Dossier,Date PV,Sanction,Portée
2540001111,ALVES Kylian,District Paris,DOS-99,2023-11-02,1 match ferme,Toutes épreuves`;

      const result = parseFootclubsDisciplineCsv(csv, CLUB_ID);
      expect(result.success).toBe(true);
      expect(result.records).toHaveLength(1);
      expect(result.records[0].license_number).toBe('2540001111');
      expect(result.records[0].scope).toBe('all_competitions');
    });

    it('retourne une erreur explicite si la colonne N° Licence est manquante', () => {
      const invalidCsv = `Nom;Prénom;Sanction\nDupont;Lucas;2 matchs`;
      const result = parseFootclubsDisciplineCsv(invalidCsv, CLUB_ID);
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('N° Licence');
    });
  });

  describe('2. Calculs réglementaires FFF (Prise d’effet le lundi, dates, portées)', () => {
    it('calcule la date de prise d’effet légale le lundi suivant (Règlements FFF Art. 226)', () => {
      // Jeudi 12 octobre 2023 -> Lundi suivant 16 octobre 2023
      const monday = computeFffMondayEffectiveDate('12/10/2023');
      expect(monday).toBe('2023-10-16');

      // Dimanche 15 octobre 2023 -> Lundi suivant 16 octobre 2023
      const mondayFromSunday = computeFffMondayEffectiveDate('15/10/2023');
      expect(mondayFromSunday).toBe('2023-10-16');

      // Lundi 16 octobre 2023 -> Lundi suivant 23 octobre 2023 (+7j)
      const mondayFromMonday = computeFffMondayEffectiveDate('16/10/2023');
      expect(mondayFromMonday).toBe('2023-10-23');
    });

    it('déduit correctement les types de sanctions (temps fixe vs nombre de matchs)', () => {
      const timeFixed = deduceSanctionType('Suspension temporaire', '2023-10-01', '2023-10-31');
      expect(timeFixed.type).toBe('time_fixed');

      const matchesFixed = deduceSanctionType('3 matchs fermes');
      expect(matchesFixed.type).toBe('matches_fixed');
      expect(matchesFixed.matchesTotal).toBe(3);

      const conditional = deduceSanctionType('1 match avec sursis');
      expect(conditional.type).toBe('conditional');
    });
  });

  describe('3. Évaluation d’éligibilité contextuelle du joueur', () => {
    it('signale verification_required si le joueur n’a pas de N° de licence FFF', async () => {
      const playerWithoutLicense = {
        uid: 'p_no_lic',
        display_name: 'Joueur Sans Licence',
      };
      const matchCtx: MatchEligibilityContext = {
        event_type: 'competition',
        match_date: '2023-10-20',
      };

      const evalRes = await playerDisciplinaryService.evaluatePlayerEligibility(
        playerWithoutLicense,
        matchCtx,
        CLUB_ID
      );

      expect(evalRes.status).toBe('verification_required');
      expect(evalRes.blocking_for_official_sheet).toBe(true);
      expect(evalRes.summary).toContain('N° de licence FFF manquant');
    });

    it('signale unavailable_or_outdated si aucune donnée n’a été importée (ne présume jamais d’éligibilité)', async () => {
      const player = {
        uid: 'p_valid',
        license_number: '2541890123',
        display_name: 'Lucas Dupont',
      };
      const matchCtx: MatchEligibilityContext = {
        event_type: 'competition',
        match_date: '2023-10-20',
      };

      const evalRes = await playerDisciplinaryService.evaluatePlayerEligibility(
        player,
        matchCtx,
        'club_empty_discipline'
      );

      expect(evalRes.status).toBe('unavailable_or_outdated');
      expect(evalRes.blocking_for_official_sheet).toBe(true);
      expect(evalRes.is_stale).toBe(true);
    });

    it('déclare le joueur éligible si aucune suspension active ne correspond à son N° de licence', async () => {
      // Importer une sanction pour un AUTRE joueur
      const csv = `N° Licence;Nom;Commission;PV;Date;Effet;Sanction;Portée
9999999999;AUTRE JOUEUR;Commission;PV-1;01/10/2023;02/10/2023;2 matchs;Officiel`;
      await playerDisciplinaryService.importFootclubsCsv(CLUB_ID, csv);

      const player = {
        uid: 'p_clean',
        license_number: '2541890123',
        display_name: 'Lucas Dupont',
      };
      const matchCtx: MatchEligibilityContext = {
        event_type: 'competition',
        match_date: new Date().toISOString(),
      };

      const evalRes = await playerDisciplinaryService.evaluatePlayerEligibility(
        player,
        matchCtx,
        CLUB_ID
      );

      expect(evalRes.status).toBe('clean');
      expect(evalRes.blocking_for_official_sheet).toBe(false);
    });

    it('respecte la prise d’effet : éligible pour le match du week-end avant le lundi d’effet', async () => {
      // Sanction notifiée le jeudi 12/10/2023 avec effet au lundi 16/10/2023
      const csv = `N° Licence;Nom;Commission;PV;Date;Effet;Sanction;Portée
2541890123;DUPONT Lucas;Commission FFF;PV-10;12/10/2023;2023-10-16;2 matchs;Officiel`;
      await playerDisciplinaryService.importFootclubsCsv(CLUB_ID, csv);

      const player = {
        uid: 'p_dupont',
        license_number: '2541890123',
        display_name: 'Lucas Dupont',
      };

      // Match le samedi 14 octobre 2023 (avant le lundi 16 octobre)
      const matchBeforeMonday: MatchEligibilityContext = {
        event_type: 'competition',
        match_date: '2023-10-14',
      };

      const resBefore = await playerDisciplinaryService.evaluatePlayerEligibility(
        player,
        matchBeforeMonday,
        CLUB_ID
      );
      // Avant le lundi d'effet, le joueur peut disputer le match
      expect(resBefore.status).toBe('clean');

      // Match le samedi 21 octobre 2023 (après la prise d'effet du lundi 16)
      const matchAfterMonday: MatchEligibilityContext = {
        event_type: 'competition',
        match_date: '2023-10-21',
      };

      const resAfter = await playerDisciplinaryService.evaluatePlayerEligibility(
        player,
        matchAfterMonday,
        CLUB_ID
      );
      expect(resAfter.status).toBe('suspended');
      expect(resAfter.blocking_for_official_sheet).toBe(true);
    });

    it('gère la règle spécifique des matchs amicaux (ne purgent pas les suspensions officielles)', async () => {
      const csv = `N° Licence;Nom;Commission;PV;Date;Effet;Sanction;Portée
2541890123;DUPONT Lucas;Commission FFF;PV-10;01/10/2023;2023-10-02;2 matchs;Championnat`;
      await playerDisciplinaryService.importFootclubsCsv(CLUB_ID, csv);

      const player = {
        uid: 'p_dupont',
        license_number: '2541890123',
        display_name: 'Lucas Dupont',
      };

      // 1. En match amical, le joueur sous sanction de championnat n'est pas bloqué, mais un rappel de non-purge est émis
      const friendlyMatch: MatchEligibilityContext = {
        event_type: 'friendly',
        match_date: '2023-10-10',
      };

      const friendlyRes = await playerDisciplinaryService.evaluatePlayerEligibility(
        player,
        friendlyMatch,
        CLUB_ID
      );
      expect(friendlyRes.status).toBe('clean');
      expect(friendlyRes.detailed_reason).toContain('ne comptera pas dans la purge');

      // 2. En match officiel, il reste suspendu
      const officialMatch: MatchEligibilityContext = {
        event_type: 'competition',
        match_date: '2023-10-15',
      };
      const officialRes = await playerDisciplinaryService.evaluatePlayerEligibility(
        player,
        officialMatch,
        CLUB_ID
      );
      expect(officialRes.status).toBe('suspended');
    });

    it('purge les matchs au fur et à mesure des rencontres officielles disputées', async () => {
      const csv = `N° Licence;Nom;Commission;PV;Date;Effet;Sanction;Portée
2541890123;DUPONT Lucas;Commission FFF;PV-10;01/10/2023;2023-10-02;1 match;Officiel`;
      await playerDisciplinaryService.importFootclubsCsv(CLUB_ID, csv);

      const player = {
        uid: 'p_dupont',
        license_number: '2541890123',
        display_name: 'Lucas Dupont',
      };
      const matchCtx: MatchEligibilityContext = {
        event_type: 'competition',
        match_date: '2023-10-20',
      };

      // Initialement suspendu pour 1 match
      const beforeServe = await playerDisciplinaryService.evaluatePlayerEligibility(
        player,
        matchCtx,
        CLUB_ID
      );
      expect(beforeServe.status).toBe('suspended');

      // Purge du match après avoir purgé 1 match officiel
      await playerDisciplinaryService.recordMatchServed(CLUB_ID, '2541890123');

      const afterServe = await playerDisciplinaryService.evaluatePlayerEligibility(
        player,
        matchCtx,
        CLUB_ID
      );
      expect(afterServe.status).toBe('clean');
      expect(afterServe.summary).toContain('purgées');
    });
  });

  describe('4. Audit trail des déblocages exceptionnels (Manual Overrides)', () => {
    it('permet à un dirigeant ou coach de consigner un override exceptionnel tracé', async () => {
      const csv = `N° Licence;Nom;Commission;PV;Date;Effet;Sanction;Portée
2541890123;DUPONT Lucas;Commission FFF;PV-10;01/10/2023;2023-10-02;3 matchs;Officiel`;
      await playerDisciplinaryService.importFootclubsCsv(CLUB_ID, csv);

      const player = {
        uid: 'p_dupont',
        license_number: '2541890123',
        display_name: 'Lucas Dupont',
      };
      const matchCtx: MatchEligibilityContext = {
        event_type: 'competition',
        match_date: '2023-10-20',
      };

      // Consigner l'override avec PV officiel d'appel
      const override = await playerDisciplinaryService.recordManualOverride(CLUB_ID, {
        player_uid: 'p_dupont',
        license_number: '2541890123',
        authorized_by_uid: 'coach_jean',
        authorized_by_name: 'Jean Coach BEF',
        reason: 'Effet suspensif accordé suite à appel officiel',
        official_document_ref: 'PV Commission Appel N°44-B',
      });

      expect(override.id).toBeDefined();
      expect(override.official_document_ref).toBe('PV Commission Appel N°44-B');

      // Évaluation : l'override est pris en compte et tracé
      const evalRes = await playerDisciplinaryService.evaluatePlayerEligibility(
        player,
        matchCtx,
        CLUB_ID
      );

      expect(evalRes.is_overridden).toBe(true);
      expect(evalRes.status).toBe('clean');
      expect(evalRes.override_details?.authorized_by_name).toBe('Jean Coach BEF');
      expect(evalRes.detailed_reason).toContain('PV Commission Appel N°44-B');
    });
  });

  describe('5. Contrôle de la composition d’équipe et Guardrails', () => {
    it('bloque la validation officielle si un joueur suspendu est présent, tout en autorisant un amical', async () => {
      const csv = `N° Licence;Nom;Commission;PV;Date;Effet;Sanction;Portée
2541890123;DUPONT Lucas;Commission FFF;PV-10;01/10/2023;2023-10-02;2 matchs;Officiel`;
      await playerDisciplinaryService.importFootclubsCsv(CLUB_ID, csv);

      const members: User[] = [
        {
          uid: 'p_dupont',
          display_name: 'Lucas Dupont',
          email: 'dupont@proday.club',
          role: 'player',
          is_verified: true,
          verification_status: 'VERIFIED',
          profile: {
            license_number: '2541890123',
            club_id: CLUB_ID,
          },
          documents: [],
          created_at: new Date(),
          updated_at: new Date(),
          is_active: true,
        },
        {
          uid: 'p_clean',
          display_name: 'Marc Martin',
          email: 'martin@proday.club',
          role: 'player',
          is_verified: true,
          verification_status: 'VERIFIED',
          profile: {
            license_number: '9999999999',
            club_id: CLUB_ID,
          },
          documents: [],
          created_at: new Date(),
          updated_at: new Date(),
          is_active: true,
        },
      ];

      // Test A : Match officiel -> Bloquant !
      const officialMatch: MatchEligibilityContext = {
        event_type: 'competition',
        match_date: '2023-10-20',
      };
      const officialReport = await playerDisciplinaryService.evaluateLineupEligibility(
        ['p_dupont', 'p_clean'],
        members,
        officialMatch,
        CLUB_ID
      );
      expect(officialReport.hasSuspended).toBe(true);
      expect(officialReport.canSubmitOfficial).toBe(false);
      expect(officialReport.blockingPlayers).toHaveLength(1);

      // Test B : Match amical -> Autorisé !
      const friendlyMatch: MatchEligibilityContext = {
        event_type: 'friendly',
        match_date: '2023-10-20',
      };
      const friendlyReport = await playerDisciplinaryService.evaluateLineupEligibility(
        ['p_dupont', 'p_clean'],
        members,
        friendlyMatch,
        CLUB_ID
      );
      expect(friendlyReport.hasSuspended).toBe(false);
      expect(friendlyReport.canSubmitOfficial).toBe(true);
    });
  });
});
