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
  it('route vers les sections Cockpit', () => {
    expect(resolveAdminWorkItemNavigation(navItem('verification', 'utilisateurs', 'u1'))).toEqual({
      section: 'utilisateurs',
      focusId: 'u1',
    });
    expect(resolveAdminWorkItemNavigation(navItem('club_quote', 'clubs', 'q1'))).toEqual({
      section: 'clubs',
      focusId: 'q1',
    });
    expect(resolveAdminWorkItemNavigation(navItem('membership', 'identite', 'm1'))).toEqual({
      section: 'identite',
      focusId: 'm1',
    });
    expect(resolveAdminWorkItemNavigation(navItem('payment', 'tour'))).toEqual({
      section: 'tour',
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
      targetSection: 'utilisateurs',
      entityId: 'uid-1',
      focusQuery: 'A',
    };
    expect(resolveAdminSearchHitNavigation(hit)).toEqual({
      section: 'utilisateurs',
      focusId: 'uid-1',
      query: 'A',
    });
  });
});
