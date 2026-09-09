/**
 * Espace Admin — contrats navigation + modules.
 */
import {
  ADMIN_NAV_ITEMS,
  ADMIN_PRIMARY_NAV_IDS,
  ADMIN_RAIL_IDS,
  ADMIN_MENU_DEST_IDS,
  resolveAdminNav,
} from '../features/admin/navigation/adminNavConfig';
import { ADMIN_MOTION_SECTION_ORDER } from '../features/admin/motion/adminMotion';

describe('Espace Admin module map', () => {
  it('expose un menu riche (≥20 pages) sans dock Menu legacy', () => {
    const ids = ADMIN_NAV_ITEMS.map((n) => n.id);
    expect(ids.length).toBeGreaterThanOrEqual(20);
    expect(ids).toContain('overview');
    expect(ids).toContain('users');
    expect(ids).toContain('clubs');
    expect(ids).toContain('claims');
    expect(ids).toContain('effectifs');
    expect(ids).toContain('classements');
    expect(ids).toContain('audit');
    expect(ids).toContain('config');
    expect(ADMIN_RAIL_IDS).toEqual(ids);
    expect(ADMIN_PRIMARY_NAV_IDS).toEqual(ids);
    expect(ADMIN_MENU_DEST_IDS).toEqual([]);
    expect(ADMIN_MOTION_SECTION_ORDER[0]).toBe('overview');
    expect(ADMIN_MOTION_SECTION_ORDER).not.toContain('menu');
    expect(ADMIN_MOTION_SECTION_ORDER).not.toContain('tour');
    expect(ADMIN_MOTION_SECTION_ORDER).not.toContain('pulse');
    expect(resolveAdminNav('standings').section).toBe('classements');
    expect(resolveAdminNav('rosters').section).toBe('effectifs');
    expect(resolveAdminNav('claims').section).toBe('claims');
    expect(resolveAdminNav('users').section).toBe('users');
  });
});
