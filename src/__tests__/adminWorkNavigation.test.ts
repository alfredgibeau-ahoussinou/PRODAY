import { resolveAdminWorkItemNavigation, resolveAdminSearchHitNavigation } from '../utils/adminWorkNavigation';
import type { AdminWorkItem } from '../utils/adminInsights';

function navItem(
  kind: AdminWorkItem['kind'],
  targetSection: AdminWorkItem['targetSection'],
  entityId?: string,
): AdminWorkItem {
  return {
    id: `${kind}-1`,
    kind,
    priority: 'medium',
    title: 'Test',
    subtitle: 'Sub',
    targetSection,
    entityId,
  };
}

describe('adminWorkNavigation', () => {
  it('conserve la section cible de la file', () => {
    expect(resolveAdminWorkItemNavigation(navItem('verification', 'utilisateurs', 'u1'))).toEqual({
      section: 'utilisateurs',
      focusId: 'u1',
    });
    expect(resolveAdminWorkItemNavigation(navItem('club_quote', 'commercial', 'q1'))).toEqual({
      section: 'commercial',
      focusId: 'q1',
    });
    expect(resolveAdminWorkItemNavigation(navItem('payment', 'finances'))).toEqual({
      section: 'finances',
      focusId: undefined,
    });
  });

  it('mappe un hit recherche club vers Clubs', () => {
    expect(
      resolveAdminSearchHitNavigation({
        id: 'c-1',
        kind: 'club',
        title: 'AS Test',
        subtitle: 'Paris',
        targetSection: 'clubs',
        entityId: 'c-1',
      }),
    ).toEqual({ section: 'clubs', focusId: 'c-1', query: undefined });
  });
});
