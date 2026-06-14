jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));
jest.mock('../lib/firebase', () => ({ getDb: jest.fn(() => null) }));
jest.mock('../config/firebase', () => ({ isFirebaseConfigured: () => false }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PARENTAL_SETTINGS } from '../models/ParentalSettings';
import {
  evaluateScreenTimeAccess,
  getScreenTimeMinutesUsed,
  isScreenTimeActiveDay,
  recordScreenTimeMinute,
} from '../utils/parentalScreenTime';
import { resolveDailyLimitMinutes } from '../utils/parentalScreenTimeLimits';

describe('parentalScreenTime', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('détecte les jours actifs', () => {
    const label = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][new Date().getDay()];
    expect(isScreenTimeActiveDay(['Lun', 'Mar'])).toBe(['Lun', 'Mar'].includes(label));
  });

  it('bloque quand la limite est atteinte', async () => {
    const uid = 'minor-1';
    const settings = {
      ...DEFAULT_PARENTAL_SETTINGS,
      screen_time_enabled: true,
      daily_limit_minutes: 15,
      active_days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    };
    for (let i = 0; i < 15; i++) await recordScreenTimeMinute(uid);
    const used = await getScreenTimeMinutesUsed(uid);
    expect(used).toBe(15);
    const result = await evaluateScreenTimeAccess(uid, settings);
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('limit_reached');
  });

  it('borne la limite quotidienne', () => {
    expect(resolveDailyLimitMinutes({ ...DEFAULT_PARENTAL_SETTINGS, daily_limit_minutes: 5 })).toBe(
      15,
    );
    expect(
      resolveDailyLimitMinutes({ ...DEFAULT_PARENTAL_SETTINGS, daily_limit_minutes: 999 }),
    ).toBe(480);
  });
});
