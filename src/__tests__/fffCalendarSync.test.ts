import AsyncStorage from '@react-native-async-storage/async-storage';
import { fffCalendarSyncService } from '../services/fffCalendarSync.service';
import { fffScraperService } from '../services/fffScraper.service';
import type { RsvpStatus } from '../models/TeamEvent';
type MockNamesRecord = {
  d1_d92: string;
  r1_idf_b: string;
  r2_idf: string;
  ligue1: string;
};
const mockGetName = (leagueId: string): string => {
  const names: MockNamesRecord = {
    d1_d92: 'Départemental 1 · District 92 (Hauts-de-Seine)',
    r1_idf_b: 'Régional 1 Île-de-France · Poule B',
    r2_idf: 'Régional 2 Île-de-France · Poule B',
    ligue1: "Ligue 1 McDonald's",
  };
  return (names as Record<string, string>)[leagueId] ?? `Championnat FFF · ${leagueId}`;
};

const mockGetDivisionLabel = (leagueId: string): string => {
  const labels: MockNamesRecord = {
    d1_d92: 'District des Hauts-de-Seine FFF · Seniors D1 (Poule Unique)',
    r1_idf_b: 'Ligue de Paris Île-de-France · Seniors R1 (Poule B)',
    r2_idf: 'Ligue de Paris Île-de-France · Seniors R2 (Poule B)',
    ligue1: 'Championnat de France',
  };
  return (labels as Record<string, string>)[leagueId] ?? 'Championnat FFF Officiel';
};

jest.mock('../services/frenchFootballStandings.service', () => ({
  frenchFootballStandingsService: {
    getLeagueStandings: jest.fn().mockImplementation((leagueId) =>
      Promise.resolve({
        id: leagueId,
        name: mockGetName(leagueId),
        category: 'district',
        districtCode: '92',
        region: 'Île-de-France',
        divisionLabel: `2026-2027 · ${mockGetDivisionLabel(leagueId)}`,
        season: '2026-2027',
        standings: [],
        scorers: [],
        officialFffCertified: false,
        lastSyncAt: new Date().toISOString(),
      })
    ),
    searchClubs: jest.fn().mockReturnValue(Promise.resolve([])),
  },
}));

describe('fffCalendarSyncService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  describe('getImportedFffEvents / save / clear', () => {
    it('gère le cycle de vie du stockage local des événements importés', async () => {
      const fakeEvents = [
        {
          id: 'evt-1',
          title: 'J1 · Montrouge FC 92 2 vs AC Boulogne-Billancourt 2',
          description: 'Rencontre officielle FFF',
          event_type: 'competition' as const,
          organizer_uid: 'staff_proday_fff',
          organizer_name: 'Staff Officiel FFF',
          team_id: 'team_1',
          competition_fixture_id: 'fff_fixture_1',
          starts_at: new Date('2026-09-12T15:00:00.000Z'),
          ends_at: new Date('2026-09-12T16:45:00.000Z'),
          city: 'Hauts-de-Seine',
          location_label: 'Stade de Montrouge',
          invitee_uids: [] as string[],
          rsvps: {} as Record<string, RsvpStatus>,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      await fffCalendarSyncService.saveImportedFffEvents(fakeEvents);
      let stored = await fffCalendarSyncService.getImportedFffEvents();
      expect(stored).toHaveLength(1);
      expect(stored[0].title).toContain('Montrouge');

      await fffCalendarSyncService.clearImportedFffEvents();
      stored = await fffCalendarSyncService.getImportedFffEvents();
      expect(stored).toEqual([]);
    });
  });

  describe('importFffCalendarToTeamEvents (cloud-first, fixtures live)', () => {
    it('renvoie 0 événements importés quand aucune fixture live n\'est disponible', async () => {
      const res = await fffCalendarSyncService.importFffCalendarToTeamEvents('d1_d92', 'montrouge');
      expect(res.importedCount).toBe(0);
      expect(res.events).toEqual([]);
    });

    it('rend les fixtures disponibles une fois que le sync quotidien a peuplé Firestore', async () => {
      const res = await fffCalendarSyncService.importFffCalendarToTeamEvents('d1_d92', 'montrouge');
      expect(Array.isArray(res.events)).toBe(true);
    });
  });

  describe('getHeadToHeadMatchup (cloud-first)', () => {
    it('renvoie null quand aucune donnée live n\'est disponible dans Firestore', async () => {
      const matchup = await fffCalendarSyncService.getHeadToHeadMatchup('d1_d92', 'montrouge');
      expect(matchup).toBeNull();
    });

    it('calcule le face-à-face quand les données live sont disponibles', async () => {
      const matchup = await fffCalendarSyncService.getHeadToHeadMatchup('d1_d92', 'montrouge');
      if (matchup) {
        expect(matchup.competitionName).toBeDefined();
        expect(matchup.analysis).toBeDefined();
        expect(matchup.myTeam).toBeDefined();
        expect(matchup.opponent).toBeDefined();
      }
    });
  });
});

