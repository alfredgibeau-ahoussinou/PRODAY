/**
 * Bureau Ops — contrats navigation + modules.
 */
import {
  ADMIN_NAV_ITEMS,
  ADMIN_PRIMARY_NAV_IDS,
  ADMIN_RAIL_IDS,
  ADMIN_MENU_DEST_IDS,
  resolveAdminNav,
} from '../features/admin/navigation/adminNavConfig';
import { ADMIN_MOTION_SECTION_ORDER } from '../features/admin/motion/adminMotion';

describe('Bureau Ops module map', () => {
  it('aligne rail et motion order — sans dock Menu', () => {
    const ids = ADMIN_NAV_ITEMS.map((n) => n.id);
    expect(ids).toEqual([
      'pulse',
      'file',
      'annuaire',
      'comptes',
      'effectifs',
      'classements',
    ]);
    expect(ADMIN_RAIL_IDS).toEqual(ids);
    expect(ADMIN_PRIMARY_NAV_IDS).toEqual(ids);
    expect(ADMIN_MENU_DEST_IDS).toEqual([]);
    expect(ADMIN_MOTION_SECTION_ORDER[0]).toBe('pulse');
    expect(ADMIN_MOTION_SECTION_ORDER).not.toContain('menu');
    expect(ADMIN_MOTION_SECTION_ORDER).not.toContain('tour');
    expect(resolveAdminNav('standings').section).toBe('classements');
    expect(resolveAdminNav('rosters').section).toBe('effectifs');
    expect(resolveAdminNav('claims').section).toBe('file');
  });
});
