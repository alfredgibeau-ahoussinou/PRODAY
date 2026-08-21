import { adminLayout, adminSpace } from '../features/admin/theme/adminDesignSystem';

/** Tokens / direction couverts par prodayMotionSystem.test.ts (alias global). */
describe('Admin mobile safe area layout', () => {
  it('garde un air confortable sous la status bar / îlot', () => {
    expect(adminLayout.contentTop).toBeGreaterThanOrEqual(adminSpace.xl);
    expect(adminLayout.statusBarMin).toBeGreaterThanOrEqual(44);
    const simulatedInset = 0;
    const pad =
      Math.max(simulatedInset, adminLayout.statusBarMin) + adminLayout.contentTop;
    expect(pad).toBeGreaterThanOrEqual(54 + adminSpace.xl);
  });
});
