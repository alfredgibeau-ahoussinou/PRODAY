import { adminChrome, adminLayout, adminSpace } from '../features/admin/theme/adminDesignSystem';

/** Tokens / direction couverts par prodayMotionSystem.test.ts (alias global). */
describe('Espace Admin layout chrome', () => {
  it('rail permanent + strip — plus de dock bottom', () => {
    expect(adminChrome.dockRailHeight).toBe(0);
    expect(adminChrome.sidebarCollapsed).toBeGreaterThanOrEqual(56);
    expect(adminLayout.statusBarMin).toBeGreaterThanOrEqual(44);
    expect(adminLayout.contentTop).toBeGreaterThanOrEqual(adminSpace.md);
    expect(adminLayout.hitTarget).toBeGreaterThanOrEqual(44);
  });
});
