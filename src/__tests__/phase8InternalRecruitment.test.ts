import {
  ROSTER_URGENCY_LABELS,
  type ClubRosterNeed,
  type RosterNeedUrgency,
} from '../models/ClubRosterBoard';
import {
  TRIAL_SHEET_DECISION_LABELS,
  type ClubTrialSheet,
  type TrialSheetDecision,
  canViewTrialSheet,
} from '../models/ClubTrialSheet';
import {
  FRIENDLY_STATUS_LABELS,
  type FriendlyMatch,
  type CounterProposeFriendlyMatchInput,
} from '../models/FriendlyMatch';
import { matchPlayersToRosterNeed } from '../utils/clubRosterMatching';
import type { User } from '../models/User';

describe('Phase 8 — Recrutement interne + Matchs entre clubs', () => {
  describe('RosterNeed urgency', () => {
    it('should have all urgency labels', () => {
      const keys: RosterNeedUrgency[] = ['low', 'medium', 'high', 'critical'];
      for (const k of keys) {
        expect(ROSTER_URGENCY_LABELS[k]).toBeTruthy();
      }
    });

    it('need model accepts urgency and qualities', () => {
      const need: ClubRosterNeed = {
        id: 'n1',
        club_id: 'c1',
        team_id: 't1',
        team_label: 'U15 A',
        category: 'U15',
        position: 'defender',
        qualities: ['rapide', 'bon jeu de tête'],
        urgency: 'high',
        players_needed: 1,
        scope: 'internal',
        status: 'open',
        created_by_uid: 'u1',
        created_by_name: 'Coach A',
        created_at: new Date(),
      };
      expect(need.urgency).toBe('high');
      expect(need.qualities).toEqual(['rapide', 'bon jeu de tête']);
    });
  });

  describe('TrialSheet decision', () => {
    it('should have all decision labels', () => {
      const keys: TrialSheetDecision[] = ['retained', 'not_retained', 'to_review'];
      for (const k of keys) {
        expect(TRIAL_SHEET_DECISION_LABELS[k]).toBeTruthy();
      }
    });

    it('sheet model accepts decision field', () => {
      const sheet: ClubTrialSheet = {
        id: 's1',
        club_id: 'c1',
        first_name: 'Ali',
        last_name: 'Dupont',
        birth_year: 2012,
        position: 'Milieu',
        trial_date: new Date(),
        coach_uid: 'coach1',
        coach_name: 'Coach B',
        ratings: { technique: 4, intensity: 3 },
        overall: 3.5,
        decision: 'retained',
        is_minor: true,
        authorized_uids: ['coach1'],
        created_at: new Date(),
        updated_at: new Date(),
      };
      expect(sheet.decision).toBe('retained');
    });

    it('canViewTrialSheet checks authorized_uids', () => {
      const sheet: ClubTrialSheet = {
        id: 's1',
        club_id: 'c1',
        first_name: 'A',
        last_name: 'B',
        birth_year: 2012,
        position: 'DC',
        trial_date: new Date(),
        coach_uid: 'coach1',
        coach_name: 'C',
        ratings: {},
        overall: null,
        decision: null,
        is_minor: true,
        authorized_uids: ['coach1'],
        created_at: new Date(),
        updated_at: new Date(),
      };
      expect(canViewTrialSheet(sheet, 'coach1')).toBe(true);
      expect(canViewTrialSheet(sheet, 'random')).toBe(false);
      expect(canViewTrialSheet(sheet, 'random', { isClubAdmin: true })).toBe(true);
    });
  });

  describe('FriendlyMatch statuses', () => {
    it('should cover COUNTERED status', () => {
      expect(FRIENDLY_STATUS_LABELS.COUNTERED).toBe('Contre-proposition');
    });

    it('counter proposal input has required fields', () => {
      const input: CounterProposeFriendlyMatchInput = {
        matchId: 'm1',
        clubId: 'c2',
        clubName: 'FC Test',
        date: new Date(),
        time_label: '15h00',
        city: 'Lyon',
        message: 'Préférence samedi',
      };
      expect(input.matchId).toBe('m1');
    });
  });

  describe('matchPlayersToRosterNeed with urgency', () => {
    const need: ClubRosterNeed = {
      id: 'n1',
      club_id: 'c1',
      team_id: 't1',
      team_label: 'U15 A',
      category: 'U15',
      position: 'defender',
      urgency: 'critical',
      qualities: ['rapide'],
      players_needed: 1,
      scope: 'internal',
      status: 'open',
      created_by_uid: 'u1',
      created_by_name: 'Coach',
      created_at: new Date(),
    };

    const player: User = {
      uid: 'p1',
      display_name: 'Joueur DC',
      email: '',
      role: 'player',
      profile: {
        club_id: 'c1',
        team_id: 't2',
        position: 'Défenseur central',
        category: 'U15',
        level: 'Départemental',
      },
    } as unknown as User;

    it('returns matching candidates', () => {
      const results = matchPlayersToRosterNeed(need, [player], { t2: 'U15 B' });
      expect(results.length).toBe(1);
      expect(results[0].display_name).toBe('Joueur DC');
      expect(results[0].score).toBeGreaterThanOrEqual(50);
    });

    it('excludes players on same team', () => {
      const sameTeam = {
        ...player,
        uid: 'p2',
        display_name: 'Même équipe',
        profile: { ...player.profile, team_id: 't1' },
      } as unknown as User;
      const results = matchPlayersToRosterNeed(need, [sameTeam], { t1: 'U15 A' });
      expect(results.length).toBe(0);
    });
  });
});
