import {
  COACH_NAV_FOLDERS,
  coachNavFromTab,
  findCoachNavItem,
  tabFromCoachNav,
} from '../features/coach/navigation/coachNavConfig';
import { resolveCoachNavFolders } from '../features/coach/navigation/resolveCoachNavAccess';

describe('coachNavConfig', () => {
  it('expose Accueil · Équipe · Match · Performance', () => {
    const ids = COACH_NAV_FOLDERS.map((f) => f.id);
    expect(ids).toEqual([
      'accueil',
      'equipe',
      'match',
      'performance',
      'communication',
      'compte',
    ]);
  });

  it('mappe tabs ↔ nav', () => {
    expect(tabFromCoachNav('match_center')).toBe('matchs');
    expect(coachNavFromTab('feed')).toBe('smart_tactics');
    expect(findCoachNavItem('smart_tactics')?.requiresSmartTactics).toBe(true);
  });
});

describe('resolveCoachNavAccess', () => {
  it('soft-lock Smart Tactics si hors formule', () => {
    const locked = resolveCoachNavFolders({ canSmartTactics: false });
    const st = locked
      .flatMap((f) => f.items)
      .find((i) => i.id === 'smart_tactics');
    expect(st?.locked).toBe(true);
    expect(st?.lockReason).toMatch(/Coach Pro/i);
  });

  it('ouvre Smart Tactics si Coach Pro / club covers', () => {
    const open = resolveCoachNavFolders({ canSmartTactics: true });
    const st = open.flatMap((f) => f.items).find((i) => i.id === 'smart_tactics');
    expect(st?.locked).toBe(false);
  });
});
