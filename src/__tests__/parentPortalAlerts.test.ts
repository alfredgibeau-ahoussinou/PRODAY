import { buildParentalAlerts } from '../utils/parentalAlerts';
import { DEFAULT_PARENTAL_SETTINGS } from '../models/ParentalSettings';

describe('buildParentalAlerts', () => {
  it('signale une demande unlock pending', () => {
    const alerts = buildParentalAlerts({
      minutesUsedToday: 10,
      settings: {
        ...DEFAULT_PARENTAL_SETTINGS,
        is_minor: true,
        unlock_request: {
          status: 'pending',
          minutes: 20,
          requested_at: new Date().toISOString(),
        },
      },
    });
    expect(alerts.some((a) => a.includes('+20'))).toBe(true);
  });

  it('signale la limite de temps atteinte', () => {
    const today = new Date().toISOString().slice(0, 10);
    const alerts = buildParentalAlerts({
      minutesUsedToday: 90,
      settings: {
        ...DEFAULT_PARENTAL_SETTINGS,
        is_minor: true,
        screen_time_enabled: true,
        daily_limit_minutes: 90,
        screen_time_bonus_day: today,
        screen_time_bonus_minutes: 0,
      },
    });
    expect(alerts.some((a) => a.toLowerCase().includes('limite'))).toBe(true);
  });

  it('signale les contacts non approuvés', () => {
    const alerts = buildParentalAlerts({
      minutesUsedToday: 0,
      settings: {
        ...DEFAULT_PARENTAL_SETTINGS,
        is_minor: true,
        approved_contacts: [
          { uid: 'c1', name: 'Coach', role: 'coach', approved: false },
        ],
      },
    });
    expect(alerts.some((a) => a.includes('contact'))).toBe(true);
  });
});
