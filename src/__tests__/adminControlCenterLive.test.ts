import {
  ADMIN_NAV_ITEMS,
  ADMIN_RAIL_IDS,
  resolveAdminNav,
} from '../features/admin/navigation/adminNavConfig';

describe('Espace Admin · data & file nav', () => {
  it('garde effectifs / classements / claims dans le menu', () => {
    expect(ADMIN_NAV_ITEMS.some((n) => n.id === 'effectifs')).toBe(true);
    expect(ADMIN_NAV_ITEMS.some((n) => n.id === 'classements')).toBe(true);
    expect(ADMIN_NAV_ITEMS.some((n) => n.id === 'claims')).toBe(true);
    expect(ADMIN_RAIL_IDS).toContain('effectifs');
    expect(ADMIN_RAIL_IDS).toContain('classements');
    expect(ADMIN_RAIL_IDS).toContain('claims');
    expect(resolveAdminNav('claims').section).toBe('claims');
    expect(resolveAdminNav('identite').section).toBe('claims');
    expect(resolveAdminNav('file').section).toBe('queue');
  });
});
