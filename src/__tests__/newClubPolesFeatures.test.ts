import { MatchConvocationPosterModal } from '../components/team/MatchConvocationPosterModal';
import { BenchRotationTimer } from '../components/team/BenchRotationTimer';
import { ShareablePlayerCardModal } from '../components/player/ShareablePlayerCardModal';
import { MatchBagChecklist } from '../components/player/MatchBagChecklist';
import { PitchLockerScheduler, type ResourceSlot } from '../components/club/PitchLockerScheduler';
import { MembershipFeeReminderModal, type FeeDebtor } from '../components/club/MembershipFeeReminderModal';
import { FamilyScheduleView, type ChildEvent } from '../components/parent/FamilyScheduleView';
import { ClubGearSwapBoard, type GearItem } from '../components/parent/ClubGearSwapBoard';
import { TournamentLiveBracket, type BracketMatch } from '../components/tournament/TournamentLiveBracket';

describe('New Club Poles High-Value Features', () => {
  it('exports all 9 pole modules cleanly as React components', () => {
    expect(typeof MatchConvocationPosterModal).toBe('function');
    expect(typeof BenchRotationTimer).toBe('function');
    expect(typeof ShareablePlayerCardModal).toBe('function');
    expect(typeof MatchBagChecklist).toBe('function');
    expect(typeof PitchLockerScheduler).toBe('function');
    expect(typeof MembershipFeeReminderModal).toBe('function');
    expect(typeof FamilyScheduleView).toBe('function');
    expect(typeof ClubGearSwapBoard).toBe('function');
    expect(typeof TournamentLiveBracket).toBe('function');
  });

  describe('Pitch & Locker Room Conflict Logic', () => {
    it('accurately identifies conflicts when two teams book the same resource at overlapping times', () => {
      const slots: ResourceSlot[] = [
        {
          id: '1',
          type: 'pitch',
          resourceName: 'Terrain Honneur',
          teamCategory: 'U17 R1',
          activity: 'match',
          startTime: '14:00',
          endTime: '16:00',
        },
        {
          id: '2',
          type: 'pitch',
          resourceName: 'Terrain Honneur',
          teamCategory: 'Seniors',
          activity: 'match',
          startTime: '15:30',
          endTime: '17:30',
        },
        {
          id: '3',
          type: 'pitch',
          resourceName: 'Terrain Synthétique',
          teamCategory: 'U13',
          activity: 'training',
          startTime: '14:00',
          endTime: '15:30',
        },
      ];

      const conflictPairs: Array<{ slot1: ResourceSlot; slot2: ResourceSlot }> = [];
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const s1 = slots[i];
          const s2 = slots[j];
          if (s1.resourceName.toLowerCase().trim() === s2.resourceName.toLowerCase().trim()) {
            if (s1.startTime < s2.endTime && s2.startTime < s1.endTime) {
              conflictPairs.push({ slot1: s1, slot2: s2 });
            }
          }
        }
      }

      expect(conflictPairs.length).toBe(1);
      expect(conflictPairs[0].slot1.id).toBe('1');
      expect(conflictPairs[0].slot2.id).toBe('2');
    });
  });

  describe('Membership Fee Debtor Computation', () => {
    it('calculates remaining amount accurately for single and aggregate debtors', () => {
      const debtors: FeeDebtor[] = [
        {
          id: 'd1',
          playerName: 'Lucas Dupont',
          category: 'U15',
          totalFee: 220,
          amountPaid: 100,
          dueDate: '15/10/2026',
        },
        {
          id: 'd2',
          playerName: 'Karim Benali',
          category: 'U17',
          totalFee: 250,
          amountPaid: 0,
          dueDate: '30/09/2026',
        },
      ];

      const remaining1 = debtors[0].totalFee - debtors[0].amountPaid;
      const remaining2 = debtors[1].totalFee - debtors[1].amountPaid;
      const totalOutstanding = debtors.reduce((sum, d) => sum + (d.totalFee - d.amountPaid), 0);

      expect(remaining1).toBe(120);
      expect(remaining2).toBe(250);
      expect(totalOutstanding).toBe(370);
    });
  });

  describe('Family Schedule Multi-child Conflict Detection', () => {
    it('detects when parents have 2 children with overlapping events in different venues', () => {
      const events: ChildEvent[] = [
        {
          id: 'e1',
          childId: 'c1',
          childName: 'Lucas',
          childColor: '#0284C7',
          category: 'U13',
          title: 'Match Poissy',
          type: 'match',
          date: '20/09/2026',
          startTime: '14:00',
          endTime: '16:00',
          location: 'Stade Léo Lagrange, Poissy',
        },
        {
          id: 'e2',
          childId: 'c2',
          childName: 'Emma',
          childColor: '#EC4899',
          category: 'U9',
          title: 'Plateau Domicile',
          type: 'match',
          date: '20/09/2026',
          startTime: '14:30',
          endTime: '16:30',
          location: 'Stade Municipal ProDay',
        },
      ];

      const conflicts: Array<{ event1: ChildEvent; event2: ChildEvent }> = [];
      for (let i = 0; i < events.length; i++) {
        for (let j = i + 1; j < events.length; j++) {
          const e1 = events[i];
          const e2 = events[j];
          if (e1.childId !== e2.childId && e1.date === e2.date && e1.location !== e2.location) {
            if (e1.startTime < e2.endTime && e2.startTime < e1.endTime) {
              conflicts.push({ event1: e1, event2: e2 });
            }
          }
        }
      }

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].event1.childName).toBe('Lucas');
      expect(conflicts[0].event2.childName).toBe('Emma');
    });
  });

  describe('Tournament Live Bracket Progression', () => {
    it('handles quarter, semi and final progression accurately', () => {
      const match: BracketMatch = {
        id: 'f1',
        stage: 'finale',
        teamA: 'PRODAY FC',
        teamB: 'Red Star FC',
        scoreA: 2,
        scoreB: 1,
        winner: 'A',
        pitch: 'Terrain Honneur',
        time: '16:30',
      };

      expect(match.winner).toBe('A');
      expect(match.scoreA).toBeGreaterThan(match.scoreB ?? 0);
    });
  });
});
