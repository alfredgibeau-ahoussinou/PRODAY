import { toCsv } from '../features/admin/utils/adminCsv';
import { canAdminUi, resolveAdminUiRole } from '../features/admin/utils/adminRbac';

describe('adminCsv', () => {
  it('escapes commas and quotes', () => {
    const csv = toCsv(
      ['id', 'name'],
      [
        [1, 'Alpha'],
        [2, 'Beta, "x"'],
      ],
    );
    expect(csv).toContain('id,name');
    expect(csv).toContain('"Beta, ""x"""');
  });
});

describe('adminRbac', () => {
  it('maps platform admin emails to super', () => {
    expect(resolveAdminUiRole('proday.admin@gmail.com')).toBe('super');
    expect(canAdminUi('proday.admin@gmail.com', 'delete_sensitive')).toBe(true);
  });

  it('defaults unknown emails to ops (no billing)', () => {
    expect(resolveAdminUiRole('ops@example.com')).toBe('ops');
    expect(canAdminUi('ops@example.com', 'billing')).toBe(false);
    expect(canAdminUi('ops@example.com', 'maintenance')).toBe(true);
  });
});
