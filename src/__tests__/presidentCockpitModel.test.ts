import {
  buildPresidentCockpitPriorities,
  buildPresidentFinanceSnapshot,
  formatPresidentEur,
} from '../features/president/ui/presidentCockpitModel';
import { buildPresidentHealth } from '../features/president/hooks/usePresidentHealth';
import type { ClubWorkspace } from '../features/club/hooks/useClubWorkspace';

describe('presidentCockpitModel', () => {
  it('formate le snapshot finance', () => {
    const empty = buildPresidentFinanceSnapshot({
      soldeEur: 0,
      recettesEur: 0,
      depensesEur: 0,
      entryCount: 0,
    });
    expect(empty.hint).toMatch(/Aucun mouvement/i);
    expect(formatPresidentEur(12.5)).toContain('12');

    const filled = buildPresidentFinanceSnapshot({
      soldeEur: 120,
      recettesEur: 200,
      depensesEur: 80,
      entryCount: 3,
    });
    expect(filled.hint).toMatch(/recettes/i);
  });

  it('construit des priorités actionnables', () => {
    const ws = {
      teams: [{ id: 't1' }],
      players: [{ uid: 'p1' }],
      coaches: [],
      pendingMemberships: 2,
      teamsWithoutCoach: 1,
      todayMatches: [{ id: 'm1' }],
      todayTrainings: [],
      events: [],
      club: { verified: true },
      briefingSummary: '',
    } as unknown as ClubWorkspace;
    const health = buildPresidentHealth(ws);
    const priorities = buildPresidentCockpitPriorities({
      health,
      pendingMemberships: 2,
      teamsWithoutCoach: 1,
      matchesToday: 1,
      financeEntryCount: 0,
    });
    expect(priorities.map((p) => p.id)).toEqual(
      expect.arrayContaining(['pending_members', 'without_coach', 'match_today', 'finance_empty']),
    );
    expect(priorities[0].nav).toBe('members');
  });
});
