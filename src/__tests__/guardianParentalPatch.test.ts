import { DEFAULT_PARENTAL_SETTINGS } from '../models/ParentalSettings';
import { buildGuardianScreenTimeSettings } from '../utils/guardianParentalPatch';

describe('guardianParentalPatch', () => {
  it('conserve les protections mineur', () => {
    const out = buildGuardianScreenTimeSettings(
      {
        ...DEFAULT_PARENTAL_SETTINGS,
        is_minor: true,
        guardian_email: 'parent@test.com',
        guardian_name: 'Parent',
        daily_limit_minutes: 60,
      },
      { screen_time_enabled: false, daily_limit_minutes: 120 },
    );
    expect(out.is_minor).toBe(true);
    expect(out.supervision_enabled).toBe(true);
    expect(out.contacts_filter_enabled).toBe(true);
    expect(out.daily_limit_minutes).toBe(120);
    expect(out.screen_time_enabled).toBe(false);
  });
});
