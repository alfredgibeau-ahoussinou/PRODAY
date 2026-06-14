import {
  loadSeasonCalendarCache,
  saveSeasonCalendarCache,
} from '../utils/seasonCalendarCache';
import type { SeasonCalendarItem } from '../utils/seasonCalendar';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
        return Promise.resolve();
      }),
    },
  };
});

const sampleItem = (): SeasonCalendarItem => ({
  id: 'ev-1',
  title: 'Match amical',
  subtitle: 'Club A',
  city: 'Paris',
  kind: 'friendly_match',
  starts_at: new Date('2026-06-15T14:00:00.000Z'),
  friendly_match_id: 'fm-1',
});

describe('seasonCalendarCache', () => {
  it('sauvegarde et recharge les entrées calendrier', async () => {
    const uid = 'user-test';
    await saveSeasonCalendarCache(uid, [sampleItem()]);
    const loaded = await loadSeasonCalendarCache(uid);
    expect(loaded).toHaveLength(1);
    expect(loaded?.[0].title).toBe('Match amical');
    expect(loaded?.[0].starts_at).toBeInstanceOf(Date);
  });
});
