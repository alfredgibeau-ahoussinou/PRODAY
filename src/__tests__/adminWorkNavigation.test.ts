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
  it('route vers les pages Espace Admin', () => {
    expect(resolveAdminWorkItemNavigation(navItem('verification', 'users', 'u1'))).toEqual({
      section: 'users',
      focusId: 'u1',
    });
    expect(resolveAdminWorkItemNavigation(navItem('club_quote', 'quotes', 'q1'))).toEqual({
      section: 'quotes',
      focusId: 'q1',
    });
    expect(resolveAdminWorkItemNavigation(navItem('membership', 'memberships', 'm1'))).toEqual({
      section: 'memberships',
      focusId: 'm1',
    });
    expect(resolveAdminWorkItemNavigation(navItem('payment', 'payments'))).toEqual({
      section: 'payments',
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
      targetSection: 'users',
      entityId: 'uid-1',
      focusQuery: 'A',
    };
    expect(resolveAdminSearchHitNavigation(hit)).toEqual({
      section: 'users',
      focusId: 'uid-1',
      query: 'A',
    });
  });
});
