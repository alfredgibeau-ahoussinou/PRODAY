import { fffScraperService } from '../services/fffScraper.service';
import { FFF_LEAGUE_METADATA } from '../services/fffScraper.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('fffScraperService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  describe('FFF_LEAGUE_METADATA', () => {
    it('contient les championnats clés d’Île-de-France et du District 92 (métadonnées uniquement, sans standings)', () => {
      expect(FFF_LEAGUE_METADATA.d1_d92).toBeDefined();
      expect(FFF_LEAGUE_METADATA.d2_d92).toBeDefined();
      expect(FFF_LEAGUE_METADATA.r1_idf_b).toBeDefined();
      expect(FFF_LEAGUE_METADATA.d1_d93).toBeDefined();
      expect(FFF_LEAGUE_METADATA.d1_d75).toBeDefined();
      expect(FFF_LEAGUE_METADATA.d1_d94).toBeDefined();
      // Les métadonnées ne contiennent JAMAIS de tableau de points (plus de seeds figés 2024/2025)
      expect(Object.keys(FFF_LEAGUE_METADATA.d1_d92!).filter((k) => k === 'standings')).toHaveLength(0);
    });

    it('Fournit les métadonnées attendues pour le District 92', () => {
      const d1 = FFF_LEAGUE_METADATA.d1_d92;
      expect(d1?.id).toBe('d1_d92');
      expect(d1?.name).toBe('Départemental 1 · District 92 (Hauts-de-Seine)');
      expect(d1?.category).toBe('district');
      expect(d1?.districtCode).toBe('92');
      expect(d1?.region).toBe('Île-de-France');
      expect(d1?.divisionLabelBase).toMatch(/District des Hauts-de-Seine/);
    });
  });

  describe('parseFffDofaResponse', () => {
    it('parse correctement la structure officielle de l’API DOFA FFF', () => {
      const sampleDofaJson = {
        donnees: {
          classement: [
            {
              clgRang: 1,
              equipe: { clgNomEquipe: 'Racing CFF', clNo: '500054' },
              clgNbJournees: 18,
              clgNbGagnes: 13,
              clgNbNuls: 3,
              clgNbPerdus: 2,
              clgNbButsPour: 38,
              clgNbButsContre: 14,
              clgTotalPoints: 42,
              clgForme: 'V,V,N,V,D',
            },
            {
              clgRang: 2,
              equipe: { clgNomEquipe: 'Montrouge FC 92', clNo: '522432' },
              clgNbJournees: 18,
              clgNbGagnes: 11,
              clgNbNuls: 4,
              clgNbPerdus: 3,
              clgNbButsPour: 32,
              clgNbButsContre: 16,
              clgTotalPoints: 37,
              clgForme: 'V,N,V,V,V',
            },
          ],
        },
      };

      const parsed = fffScraperService.parseFffDofaResponse(sampleDofaJson);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('Racing CFF');
      expect(parsed[0].rank).toBe(1);
      expect(parsed[0].points).toBe(42);
      expect(parsed[0].goal_diff).toBe(24);
      expect(parsed[0].form).toEqual(['V', 'V', 'N', 'V', 'D']);
      expect(parsed[1].name).toBe('Montrouge FC 92');
      expect(parsed[1].rank).toBe(2);
      expect(parsed[1].points).toBe(37);
    });

    it('gère les payloads non valides ou vides sans lever d’erreur', () => {
      expect(fffScraperService.parseFffDofaResponse(null)).toEqual([]);
      expect(fffScraperService.parseFffDofaResponse({})).toEqual([]);
      expect(fffScraperService.parseFffDofaResponse({ donnees: {} })).toEqual([]);
    });
  });

  describe('parseFffHtmlTable', () => {
    it('extrait les lignes depuis un tableau HTML de ligue régionale / district', () => {
      const sampleHtml = `
        <table class="table-ranking">
          <thead><tr><th>Rang</th><th>Club</th><th>Pts</th><th>J</th><th>G</th><th>N</th><th>P</th><th>Bp</th><th>Bc</th><th>Diff</th></tr></thead>
          <tbody>
            <tr>
              <td>1</td>
              <td class="club-name">CSM Gennevilliers</td>
              <td>35</td>
              <td>16</td>
              <td>11</td>
              <td>2</td>
              <td>3</td>
              <td>29</td>
              <td>13</td>
              <td>+16</td>
            </tr>
            <tr>
              <td>2</td>
              <td class="club-name">Rueil-Malmaison FC</td>
              <td>31</td>
              <td>16</td>
              <td>9</td>
              <td>4</td>
              <td>3</td>
              <td>27</td>
              <td>15</td>
              <td>+12</td>
            </tr>
          </tbody>
        </table>
      `;

      const parsed = fffScraperService.parseFffHtmlTable(sampleHtml);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('CSM Gennevilliers');
      expect(parsed[0].rank).toBe(1);
      expect(parsed[0].points).toBe(35);
      expect(parsed[0].won).toBe(11);
      expect(parsed[1].name).toBe('Rueil-Malmaison FC');
      expect(parsed[1].rank).toBe(2);
      expect(parsed[1].points).toBe(31);
    });

    it('renvoie un tableau vide pour un HTML sans table de classement', () => {
      expect(fffScraperService.parseFffHtmlTable('<div>Aucune donnée</div>')).toEqual([]);
    });
  });

  describe('AsyncStorage Cache', () => {
    it('sauvegarde et charge depuis le cache persistant (shell vide pour ligue sans données live)', async () => {
      // On simule un shell vide (ce qu'obtient le client quand aucune donnée live Firestore/DOFA n'est disponible)
      const emptyShell = {
        id: 'd1_d92',
        name: FFF_LEAGUE_METADATA.d1_d92.name,
        category: 'district' as const,
        districtCode: '92',
        region: 'Île-de-France',
        divisionLabel: `2026-2027 · ${FFF_LEAGUE_METADATA.d1_d92.divisionLabelBase} (en attente de données)`,
        season: '2026-2027',
        source: 'empty' as const,
        lastSyncAt: new Date().toISOString(),
        officialFffCertified: false,
        standings: [],
        scorers: [],
      };
      await fffScraperService.saveToCache('d1_d92', emptyShell);

      const cached = await fffScraperService.loadFromCache('d1_d92');
      expect(cached).not.toBeNull();
      expect(cached?.name).toBe('Départemental 1 · District 92 (Hauts-de-Seine)');
      expect(cached?.standings).toHaveLength(0);
      expect(cached?.source).toBe('empty');

      await fffScraperService.clearCache('d1_d92');
      const afterClear = await fffScraperService.loadFromCache('d1_d92');
      expect(afterClear).toBeNull();
    });
  });

  describe('getFixturesForTeam / getNextFixture', () => {
    it('renvoie des tableaux vides tant que les fixtures live ne sont pas encore popolées', () => {
      expect(fffScraperService.getFixturesForTeam('d1_d92', 'montrouge')).toEqual([]);
      expect(fffScraperService.getNextFixture('d1_d92', 'montrouge')).toBeNull();
    });
  });

  describe('searchIdfClubs', () => {
    it('délègue à frenchFootballStandingsService.searchClubs pour la recherche dans Firestore', async () => {
      const clubs = await fffScraperService.searchIdfClubs('montrouge');
      expect(Array.isArray(clubs)).toBe(true);
    });

    it('retourne un tableau vide pour une requête vide', async () => {
      const clubs = await fffScraperService.searchIdfClubs('');
      expect(Array.isArray(clubs)).toBe(true);
      expect(clubs).toHaveLength(0);
    });
  });

  describe('syncOfficialStandings', () => {
    it('renvoie une promesse (cloud-first, fallback shell vide si offline)', async () => {
      // syncOfficialStandings est maintenant async cloud-first
      const res = await fffScraperService.syncOfficialStandings('d1_d92');
      expect(res).toBeDefined();
      expect(res.id).toBe('d1_d92');
      // En l'absence de Firestore configuré côté test, on obtient le shell vide
      expect(res.season).toBe('2026-2027');
      expect(Array.isArray(res.standings)).toBe(true);
      expect(typeof res.source).toBe('string');
      expect(typeof res.officialFffCertified).toBe('boolean');
    });
  });
});
