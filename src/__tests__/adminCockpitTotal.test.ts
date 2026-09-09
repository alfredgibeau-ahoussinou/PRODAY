/**
 * Cockpit Total — contrats navigation + modules.
 */
import {
  ADMIN_NAV_ITEMS,
  ADMIN_PRIMARY_NAV_IDS,
  resolveAdminNav,
} from '../features/admin/navigation/adminNavConfig';
import { ADMIN_MOTION_SECTION_ORDER } from '../features/admin/motion/adminMotion';

describe('Cockpit Total module map', () => {
  it('aligne dock, sidebar et motion order', () => {
    const ids = ADMIN_NAV_ITEMS.map((n) => n.id);
    expect(ids).toEqual([
      'tour',
      'clubs',
      'identite',
      'effectifs',
      'classements',
      'utilisateurs',
    ]);
    expect(ADMIN_PRIMARY_NAV_IDS[0]).toBe('tour');
    expect(ADMIN_MOTION_SECTION_ORDER[0]).toBe('tour');
    expect(resolveAdminNav('standings').section).toBe('classements');
    expect(resolveAdminNav('rosters').section).toBe('effectifs');
  });
});
