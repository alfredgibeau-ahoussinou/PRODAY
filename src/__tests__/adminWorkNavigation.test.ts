import { resolveAdminWorkItemNavigation, resolveAdminSearchHitNavigation } from '../utils/adminWorkNavigation';
import type { AdminWorkItem, GlobalSearchResult } from '../utils/adminInsights';

function navItem(
  kind: AdminWorkItem['kind'],
  targetSection: AdminWorkItem['targetSection'],
  entityId?: string,
): AdminWorkItem {
  return {
    id: `t-${kind}`,
    kind,
    priority: 'high',
    title: 't',
    subtitle: 's',
    targetSection,
    entityId,
  };
}

describe('resolveAdminWorkItemNavigation', () => {
  it('route vers les zones Bureau Ops', () => {
    expect(resolveAdminWorkItemNavigation(navItem('verification', 'comptes', 'u1'))).toEqual({
      section: 'comptes',
      focusId: 'u1',
    });
    expect(resolveAdminWorkItemNavigation(navItem('club_quote', 'annuaire', 'q1'))).toEqual({
      section: 'annuaire',
      focusId: 'q1',
    });
    expect(resolveAdminWorkItemNavigation(navItem('membership', 'file', 'm1'))).toEqual({
      section: 'file',
      focusId: 'm1',
    });
    expect(resolveAdminWorkItemNavigation(navItem('payment', 'pulse'))).toEqual({
      section: 'pulse',
      focusId: undefined,
    });
  });
});

describe('resolveAdminSearchHitNavigation', () => {
  it('préserve focusId', () => {
    const hit: GlobalSearchResult = {
      id: 'u-1',
      kind: 'user',
      title: 'A',
      subtitle: 'b',
      targetSection: 'comptes',
      entityId: 'uid-1',
      focusQuery: 'A',
    };
    expect(resolveAdminSearchHitNavigation(hit)).toEqual({
      section: 'comptes',
      focusId: 'uid-1',
      query: 'A',
    });
  });
});
